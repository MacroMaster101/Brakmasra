-- Catalog prices retain their actual currency. A sale discount is independent of coupon codes.
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_kind text NOT NULL DEFAULT 'none';
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_value integer NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.products'::regclass AND conname='products_sale_discount_valid') THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_discount_valid CHECK (
      (discount_kind='none' AND discount_value=0) OR
      (discount_kind='percent' AND discount_value BETWEEN 1 AND 99 AND price_minor>0) OR
      (discount_kind='fixed' AND discount_value>0 AND discount_value<price_minor));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.products'::regclass AND conname='products_supported_currency') THEN
    ALTER TABLE products ADD CONSTRAINT products_supported_currency CHECK (currency IN ('LKR','USD'));
  END IF;
END $$;
-- Save products/stock and collection membership as single transactions.
-- Invoker privileges and service-role-only EXECUTE preserve the existing RLS boundary.
CREATE OR REPLACE FUNCTION public.admin_save_product(p_id uuid, p_product jsonb, p_variants jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  result_id uuid;
  item jsonb;
  variant_id uuid;
  obsolete record;
BEGIN
  IF jsonb_typeof(p_variants) <> 'array' OR jsonb_array_length(p_variants) NOT BETWEEN 1 AND 144 THEN
    RAISE EXCEPTION 'Invalid variants' USING ERRCODE = '22023';
  END IF;
  IF p_id IS NULL THEN
    INSERT INTO products (slug, name, description, currency, price_minor, fabric, care, status, category, badge, coming_soon, featured, position, si_description, si_fabric, si_care, discount_kind, discount_value)
    VALUES (p_product->>'slug', p_product->>'name', p_product->>'description', coalesce(p_product->>'currency','LKR'), (p_product->>'price_minor')::integer,
      p_product->>'fabric', p_product->'care', p_product->>'status', p_product->>'category', p_product->>'badge',
      (p_product->>'coming_soon')::boolean, (p_product->>'featured')::boolean, (p_product->>'position')::integer,
      p_product->>'si_description', p_product->>'si_fabric', p_product->'si_care', coalesce(p_product->>'discount_kind','none'), coalesce((p_product->>'discount_value')::integer,0)) RETURNING id INTO result_id;
  ELSE
    UPDATE products SET slug=p_product->>'slug', name=p_product->>'name', description=p_product->>'description',
      currency=coalesce(p_product->>'currency',currency), discount_kind=coalesce(p_product->>'discount_kind',discount_kind), discount_value=coalesce((p_product->>'discount_value')::integer,discount_value), price_minor=(p_product->>'price_minor')::integer, fabric=p_product->>'fabric', care=p_product->'care',
      status=p_product->>'status', category=p_product->>'category', badge=p_product->>'badge',
      coming_soon=(p_product->>'coming_soon')::boolean, featured=(p_product->>'featured')::boolean,
      position=(p_product->>'position')::integer, si_description=p_product->>'si_description',
      si_fabric=p_product->>'si_fabric', si_care=p_product->'si_care', updated_at=now()
    WHERE id=p_id RETURNING id INTO result_id;
    IF result_id IS NULL THEN RAISE EXCEPTION 'Product missing' USING ERRCODE='P0002'; END IF;
  END IF;
  -- Updating the product locks it, serializing variant edits for that product.
  FOR item IN SELECT value FROM jsonb_array_elements(p_variants) LOOP
    IF (item->>'inventory')::integer < 0 THEN RAISE EXCEPTION 'Negative inventory' USING ERRCODE='22023'; END IF;
    SELECT id INTO variant_id FROM product_variants WHERE product_id=result_id
      AND coalesce(size,'')=coalesce(item->>'size','') AND coalesce(color,'')=coalesce(item->>'color','') LIMIT 1;
    IF variant_id IS NULL THEN
      INSERT INTO product_variants(product_id,sku,size,color,inventory,active)
      VALUES(result_id,'SKU-'||gen_random_uuid()::text,nullif(item->>'size',''),nullif(item->>'color',''),(item->>'inventory')::integer,true);
    ELSE
      UPDATE product_variants SET inventory=(item->>'inventory')::integer,active=true WHERE id=variant_id;
    END IF;
  END LOOP;
  FOR obsolete IN SELECT id FROM product_variants v WHERE v.product_id=result_id AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_variants) desired WHERE coalesce(v.size,'')=coalesce(desired->>'size','') AND coalesce(v.color,'')=coalesce(desired->>'color','')
  ) LOOP
    BEGIN
      DELETE FROM product_variants WHERE id=obsolete.id;
    EXCEPTION WHEN foreign_key_violation THEN
      UPDATE product_variants SET active=false,inventory=0 WHERE id=obsolete.id;
    END;
  END LOOP;
  RETURN result_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_save_product(uuid,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_product(uuid,jsonb,jsonb) TO service_role;

-- Section edits merge against the latest row while holding its lock.
-- Existing full-create transactions remain unchanged.
CREATE OR REPLACE FUNCTION public.admin_save_product_section(p_id uuid, p_section text, p_patch jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE current_product jsonb; allowed text[]; variants jsonb;
BEGIN
  allowed := CASE p_section
    WHEN 'basics' THEN ARRAY['name','slug','status','category','badge','coming_soon','featured','position']
    WHEN 'pricing' THEN ARRAY['price_minor','currency','discount_kind','discount_value']
    WHEN 'details' THEN ARRAY['description','fabric','care']
    WHEN 'sinhala' THEN ARRAY['si_description','si_fabric','si_care']
    WHEN 'stock' THEN ARRAY['variants'] ELSE NULL END;
  IF allowed IS NULL OR jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid section' USING ERRCODE='22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_patch) k WHERE NOT k = ANY(allowed)) THEN
    RAISE EXCEPTION 'Invalid fields' USING ERRCODE='22023';
  END IF;
  SELECT to_jsonb(p) INTO current_product FROM products p WHERE id=p_id FOR UPDATE;
  IF current_product IS NULL THEN RAISE EXCEPTION 'Product missing' USING ERRCODE='P0002'; END IF;
  IF p_section='stock' THEN
    RETURN admin_save_product(p_id,current_product,p_patch->'variants');
  END IF;
  -- Text-only edits never touch inventory (including concurrent checkout changes).
  current_product := current_product || p_patch;
  UPDATE products SET name=current_product->>'name', slug=current_product->>'slug',
    status=current_product->>'status', category=current_product->>'category', badge=current_product->>'badge',
    coming_soon=(current_product->>'coming_soon')::boolean, featured=(current_product->>'featured')::boolean,
    currency=current_product->>'currency', discount_kind=current_product->>'discount_kind', discount_value=(current_product->>'discount_value')::integer, position=(current_product->>'position')::integer, price_minor=(current_product->>'price_minor')::integer,
    description=current_product->>'description', fabric=current_product->>'fabric', care=current_product->'care',
    si_description=current_product->>'si_description', si_fabric=current_product->>'si_fabric', si_care=current_product->'si_care', updated_at=now()
    WHERE id=p_id;
  RETURN p_id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_save_product_section(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_product_section(uuid,text,jsonb) TO service_role;

