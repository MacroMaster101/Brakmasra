-- Products picked in the Control Room to appear on the home page.
-- Safe to run more than once.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
