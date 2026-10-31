-- The store used to add each launch product's model photo in code, so the
-- Control Room could not show, reorder, or remove it. Save it as a real first
-- photo. Products whose photos were changed by staff are left alone.
WITH bundled(slug, model) AS (
  VALUES
    ('caged-freedom-tee', '/images/models/caged-freedom.webp'),
    ('look-for-the-light-tee', '/images/models/look-for-the-light.webp'),
    ('silent-faith-tee', '/images/models/silent-faith.webp'),
    ('paradise-lost-tee', '/images/models/paradise-lost.webp'),
    ('vigorous-archangel-tee', '/images/models/vigorous-archangel.webp'),
    ('naga-guard-tee', '/images/models/naga-guard.webp'),
    ('intoxicated-medusa-tee', '/images/models/intoxicated-medusa.webp'),
    ('ruthless-tee', '/images/models/ruthless.webp'),
    ('eternal-watcher-tee', '/images/models/eternal-watcher.webp')
),
targets AS (
  SELECT p.id, p.name, b.model
  FROM products p
  JOIN bundled b ON b.slug = p.slug
  WHERE (
    SELECT i.url FROM product_images i WHERE i.product_id = p.id ORDER BY i.position, i.id LIMIT 1
  ) = '/images/products/' || p.slug || '.webp'
  AND NOT EXISTS (
    SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = b.model
  )
),
shifted AS (
  UPDATE product_images SET position = position + 1
  WHERE product_id IN (SELECT id FROM targets)
  RETURNING 1
)
INSERT INTO product_images (product_id, url, alt_text, position)
SELECT id, model, name || ' worn by a model', 0 FROM targets;
