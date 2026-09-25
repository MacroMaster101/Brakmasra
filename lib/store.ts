import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { products as starterProducts, type Product } from "@/data/products";
import { productFromRow, type ProductRow } from "@/lib/store-mapping";
import { getSupabaseServerClient } from "@/lib/supabase";

/** Cache tag for everything the storefront reads; Control Room saves expire it. */
export const CATALOG_TAG = "catalog";

export const PRODUCT_SELECT =
  "id, slug, name, description, currency, price_minor, fabric, care, category, badge, coming_soon, si_description, si_fabric, si_care, position, status, updated_at, product_variants(id, sku, size, color, inventory, active), product_images(id, url, alt_text, position)";

/**
 * Active products from the database; null when no database is configured.
 * Read failures throw, so a failed read is never cached.
 */
async function loadActiveProducts(): Promise<Product[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(200);
  if (error || !data) throw new Error("Products could not be loaded.");
  return (data as unknown as ProductRow[]).map((row) => productFromRow(row, process.env.SUPABASE_URL));
}

const cachedActiveProducts = unstable_cache(loadActiveProducts, ["store-active-products"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

/**
 * What the shop shows. Until products are added in the Control Room (or when
 * the database can't be reached) the built-in launch collection is used, so
 * the storefront never goes blank.
 */
export const getCatalog = cache(async (): Promise<Product[]> => {
  try {
    const products = await cachedActiveProducts();
    return products && products.length > 0 ? products : starterProducts;
  } catch {
    return starterProducts;
  }
});

export async function getCatalogProduct(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).find((product) => product.slug === slug);
}
