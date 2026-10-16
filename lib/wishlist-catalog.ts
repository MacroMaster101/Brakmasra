import type { Product } from "@/data/products";
import { searchProducts } from "@/lib/catalog";
import { matchesShopCategory } from "@/data/shop-menu";

export const WISHLIST_TOOLS_THRESHOLD = 12;
export type WishlistFilters = { query: string; category: string; color: string; sort: "recent" | "name" | "name-desc" };

/** Search only saved catalogue items. Storage order records when a piece was saved. */
export function wishlistResults(products: Product[], slugs: string[], filters: WishlistFilters): Product[] {
  const positions = new Map(slugs.map((slug, index) => [slug, index]));
  const color = filters.color.trim().toLowerCase();
  const matching = products.filter(product => positions.has(product.slug)
    && (filters.category === "all" || matchesShopCategory(product, filters.category))
    && (color === "all" || product.colors.some(value => value.trim().toLowerCase() === color)));
  return [...searchProducts(filters.query, matching)].sort((a, b) => filters.sort === "name"
    ? a.name.localeCompare(b.name)
    : filters.sort === "name-desc" ? b.name.localeCompare(a.name)
      : positions.get(b.slug)! - positions.get(a.slug)!);
}
