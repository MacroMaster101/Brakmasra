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
    INSERT INTO products (slug, name, description, currency, price_minor, fabric, care, status, category, badge, coming_soon, featured, position, si_description, si_fabric, si_care)
    VALUES (p_product->>'slug', p_product->>'name', p_product->>'description', 'LKR', (p_product->>'price_minor')::integer,
      p_product->>'fabric', p_product->'care', p_product->>'status', p_product->>'category', p_product->>'badge',
      (p_product->>'coming_soon')::boolean, (p_product->>'featured')::boolean, (p_product->>'position')::integer,
      p_product->>'si_description', p_product->>'si_fabric', p_product->'si_care') RETURNING id INTO result_id;
  ELSE
    UPDATE products SET slug=p_product->>'slug', name=p_product->>'name', description=p_product->>'description',
      price_minor=(p_product->>'price_minor')::integer, fabric=p_product->>'fabric', care=p_product->'care',
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

CREATE OR REPLACE FUNCTION public.admin_save_collection(p_id uuid, p_collection jsonb, p_product_ids uuid[])
RETURNS uuid LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE result_id uuid;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO collections(slug,name,description,active) VALUES(p_collection->>'slug',p_collection->>'name',p_collection->>'description',(p_collection->>'active')::boolean) RETURNING id INTO result_id;
  ELSE
    UPDATE collections SET slug=p_collection->>'slug',name=p_collection->>'name',description=p_collection->>'description',active=(p_collection->>'active')::boolean WHERE id=p_id RETURNING id INTO result_id;
    IF result_id IS NULL THEN RAISE EXCEPTION 'Collection missing' USING ERRCODE='P0002'; END IF;
  END IF;
  DELETE FROM collection_products WHERE collection_id=result_id;
  INSERT INTO collection_products(collection_id,product_id,position)
    SELECT result_id, product_id, (ordinality-1)::integer FROM unnest(p_product_ids) WITH ORDINALITY AS chosen(product_id,ordinality);
  RETURN result_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_save_collection(uuid,jsonb,uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_collection(uuid,jsonb,uuid[]) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_move_product_image(p_id uuid, p_direction text)
RETURNS uuid LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE product uuid; image_ids uuid[]; old_index integer; new_index integer; other uuid;
BEGIN
  IF p_direction NOT IN ('up','down') THEN RAISE EXCEPTION 'Invalid direction' USING ERRCODE='22023'; END IF;
  SELECT product_id INTO product FROM product_images WHERE id=p_id;
  IF product IS NULL THEN RAISE EXCEPTION 'Photo missing' USING ERRCODE='P0002'; END IF;
  PERFORM 1 FROM products WHERE id=product FOR UPDATE;
  SELECT array_agg(id ORDER BY position,id) INTO image_ids FROM product_images WHERE product_id=product;
  old_index=array_position(image_ids,p_id);
  new_index=old_index+CASE WHEN p_direction='up' THEN -1 ELSE 1 END;
  IF new_index>=1 AND new_index<=array_length(image_ids,1) THEN
    other=image_ids[new_index]; image_ids[new_index]=p_id; image_ids[old_index]=other;
  END IF;
  UPDATE product_images photo SET position=(ordered.ordinality-1)::integer
    FROM unnest(image_ids) WITH ORDINALITY ordered(id,ordinality) WHERE photo.id=ordered.id;
  RETURN product;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_move_product_image(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_move_product_image(uuid,text) TO service_role;
