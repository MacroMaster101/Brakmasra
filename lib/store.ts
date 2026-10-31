import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { products as starterProducts, type Product } from "@/data/products";
import { productFromRow, type ProductRow } from "@/lib/store-mapping";
import { getSupabaseServerClient } from "@/lib/supabase";

/** Cache tag for everything the storefront reads; Control Room saves expire it. */
export const CATALOG_TAG = "catalog";

export const PRODUCT_SELECT =
  "id, slug, name, description, currency, price_minor, alternate_price_minor, discount_kind, discount_value, fabric, care, category, badge, coming_soon, featured, si_description, si_fabric, si_care, position, status, updated_at, product_variants(id, sku, size, color, inventory, active), product_images(id, url, alt_text, position)";

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
 * The starter collection is used only without a connected database. An empty
 * live catalogue stays empty: archived/deleted products must never reappear.
 */
export const getCatalog = cache(async (): Promise<Product[]> => {
  try {
    const products = await cachedActiveProducts();
    return products ?? starterProducts;
  } catch {
    return [];
  }
});

export async function getCatalogProduct(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).find((product) => product.slug === slug);
}

export type CatalogCollection = { slug: string; name: string; description: string; productIds: string[] };
const cachedCollections = unstable_cache(async (): Promise<CatalogCollection[]> => {
  const db = getSupabaseServerClient();
  if (!db) return [];
  const { data, error } = await db.from("collections").select("slug, name, description, collection_products(product_id, position)").eq("active", true).order("name").limit(200);
  if (error) throw new Error("Collections could not be loaded.");
  return (data ?? []).map((row) => ({ slug: row.slug, name: row.name, description: row.description ?? "", productIds: [...row.collection_products].sort((a, b) => a.position - b.position).map((item) => item.product_id) }));
}, ["store-active-collections"], { tags: [CATALOG_TAG], revalidate: 300 });
export const getCatalogCollections = cache(async () => { try { return await cachedCollections(); } catch { return []; } });
