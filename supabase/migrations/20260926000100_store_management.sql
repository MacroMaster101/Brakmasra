-- Store management from the Control Room: product details the storefront
-- shows, order fulfilment notes, and a public bucket for product photos.
-- Every table keeps RLS with no policies, so only the server (service role)
-- reads or writes them. Safe to run more than once.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS si_description text,
  ADD COLUMN IF NOT EXISTS si_fabric text,
  ADD COLUMN IF NOT EXISTS si_care jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IS NULL OR category IN ('Apparel', 'Headwear'));
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_badge_check;
ALTER TABLE products ADD CONSTRAINT products_badge_check
  CHECK (badge IS NULL OR badge IN ('NEW', 'LIMITED', 'BEST SELLER', 'SALE'));

CREATE INDEX IF NOT EXISTS products_status_position_idx ON products (status, position);
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images (product_id, position);
CREATE INDEX IF NOT EXISTS collection_products_product_idx ON collection_products (product_id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS admin_note text;

ALTER TABLE discounts
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Product photos. The server re-encodes every upload to WebP before storing it.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', TRUE, 921600, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
