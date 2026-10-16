import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import { wishlistResults, type WishlistFilters } from "@/lib/wishlist-catalog";

const filters: WishlistFilters = { query: "", category: "all", color: "all", sort: "recent" };
const saved = [products[0].slug, products[3].slug];

describe("wishlist search and ordering", () => {
  it("shows only saved catalogue pieces, most recently saved first", () => {
    expect(wishlistResults(products, [...saved, "removed-product"], filters).map(item => item.slug)).toEqual([...saved].reverse());
  });
  it("never returns unsaved pieces even when the search matches", () => {
    expect(wishlistResults(products, saved, { ...filters, query: products[1].name })).toEqual([]);
  });
  it("combines search, category and case-insensitive colour filtering", () => {
    expect(wishlistResults(products, saved, { ...filters, query: "paradise", category: "tees", color: " WHITE " }).map(item => item.slug)).toEqual([products[3].slug]);
    expect(wishlistResults(products, saved, { ...filters, category: "hoodies" })).toEqual([]);
  });
  it("supports future saved clothing and accessory categories", () => {
    const hoodie = { ...products[0], slug: "studio-hoodie", name: "Studio Hoodie" };
    const cap = { ...products[0], slug: "studio-cap", name: "Studio Cap", category: "Headwear" as const };
    const bag = { ...products[0], slug: "studio-tote", name: "Studio Tote Bag" };
    const future = [hoodie, cap, bag];
    const slugs = future.map(product => product.slug);
    expect(wishlistResults(future, slugs, { ...filters, category: "hoodies" })).toEqual([hoodie]);
    expect(wishlistResults(future, slugs, { ...filters, category: "headwear" })).toEqual([cap]);
    expect(wishlistResults(future, slugs, { ...filters, category: "bags" })).toEqual([bag]);
  });
  it("finds Sinhala descriptions without mutating the catalogue or saved order", () => {
    const catalog = [...products];
    const slugs = [...saved];
    expect(wishlistResults(catalog, slugs, { ...filters, query: products[0].si!.description }).map(item => item.slug)).toEqual([products[0].slug]);
    expect(catalog).toEqual(products);
    expect(slugs).toEqual(saved);
  });
  it("supports both alphabetical directions and restores all saved items when cleared", () => {
    const ascending = wishlistResults(products, saved, { ...filters, sort: "name" });
    expect(ascending.map(item => item.name)).toEqual([products[0].name, products[3].name].sort());
    expect(wishlistResults(products, saved, { ...filters, sort: "name-desc" })).toEqual([...ascending].reverse());
    expect(wishlistResults(products, saved, filters)).toHaveLength(2);
  });
});
