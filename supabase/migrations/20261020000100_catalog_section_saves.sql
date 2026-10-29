-- Section edits merge against the latest row while holding its lock.
-- Existing full-create transactions remain unchanged.
CREATE OR REPLACE FUNCTION public.admin_save_product_section(p_id uuid, p_section text, p_patch jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE current_product jsonb; allowed text[]; variants jsonb;
BEGIN
  allowed := CASE p_section
    WHEN 'basics' THEN ARRAY['name','slug','status','category','badge','coming_soon','featured','position','price_minor']
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
    position=(current_product->>'position')::integer, price_minor=(current_product->>'price_minor')::integer,
    description=current_product->>'description', fabric=current_product->>'fabric', care=current_product->'care',
    si_description=current_product->>'si_description', si_fabric=current_product->>'si_fabric', si_care=current_product->'si_care', updated_at=now()
    WHERE id=p_id;
  RETURN p_id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_save_product_section(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_product_section(uuid,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_save_collection_section(p_id uuid,p_section text,p_patch jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE current_collection jsonb; allowed text[]; ids uuid[];
BEGIN
  allowed := CASE p_section WHEN 'basics' THEN ARRAY['name','slug','description','active'] WHEN 'products' THEN ARRAY['productIds'] ELSE NULL END;
  IF allowed IS NULL OR jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid section' USING ERRCODE='22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_patch) k WHERE NOT k = ANY(allowed)) THEN
    RAISE EXCEPTION 'Invalid fields' USING ERRCODE='22023';
  END IF;
  SELECT to_jsonb(c) INTO current_collection FROM collections c WHERE id=p_id FOR UPDATE;
  IF current_collection IS NULL THEN RAISE EXCEPTION 'Collection missing' USING ERRCODE='P0002'; END IF;
  IF p_section='products' THEN
    IF jsonb_typeof(p_patch->'productIds') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid products' USING ERRCODE='22023'; END IF;
    SELECT coalesce(array_agg(value::uuid),ARRAY[]::uuid[]) INTO ids FROM jsonb_array_elements_text(p_patch->'productIds');
    RETURN admin_save_collection(p_id,current_collection,ids);
  END IF;
  current_collection := current_collection || p_patch;
  UPDATE collections SET name=current_collection->>'name',slug=current_collection->>'slug',description=current_collection->>'description',active=(current_collection->>'active')::boolean WHERE id=p_id;
  RETURN p_id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_save_collection_section(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_collection_section(uuid,text,jsonb) TO service_role;
