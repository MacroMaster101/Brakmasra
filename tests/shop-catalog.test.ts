import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { translations } from "@/lib/i18n";
import { products } from "@/data/products";

const navigation = vi.hoisted(() => ({ query: "" }));
const wishlist = vi.hoisted(() => ({ slugs: [] as string[], ready: true }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.query),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en }) }));
vi.mock("@/lib/wishlist", () => ({ useWishlist: () => wishlist }));
vi.mock("@/components/product-card", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => createElement("article", null, product.name),
}));

import { ShopCatalog } from "@/components/shop-catalog";

const render = () => renderToStaticMarkup(createElement(ShopCatalog, { products, commerceEnabled: false }));

describe("shop category states", () => {
  beforeEach(() => { navigation.query = ""; wishlist.slugs = []; wishlist.ready = true; });

  it.each(["hoodies", "sweatshirts", "headwear", "bags"])("shows a dedicated preview for %s, even with stale search and colour parameters", (category) => {
    navigation.query = `category=${category}&color=black&q=missing`;
    const html = render();
    expect(html).toContain('class="category-preview"');
    expect(html).toContain("Coming soon");
    expect(html).toContain("Back to shop");
    expect(html).not.toContain('class="catalog-filters"');
    expect(html).not.toContain("Showing 0 products");
    expect(html).not.toContain("Nothing matches");
  });

  it("keeps colour filtering inside the selected category", () => {
    navigation.query = "category=tees&color=white";
    const html = render();
    expect(html).toContain("Paradise Lost Tee");
    expect(html).not.toContain("Caged Freedom Tee");
    expect(html).toContain('class="catalog-filters"');
  });

  it("shows named merchant collections with working shop destinations", () => {
    navigation.query = "collection=first-drop";
    const html = renderToStaticMarkup(createElement(ShopCatalog, { products, commerceEnabled: true, collection: { name: "First drop", description: "Selected pieces" }, collections: [{ slug: "first-drop",name:"First drop" }] }));
    expect(html).toContain("<h1>First drop</h1>"); expect(html).toContain("Selected pieces"); expect(html).toContain('href="/shop?collection=first-drop"');
  });

  it("offers a reset without empty search quotes when a colour has no matching products", () => {
    navigation.query = "category=tees&color=white";
    const html = renderToStaticMarkup(createElement(ShopCatalog, { products: [products[0]], commerceEnabled: false }));
    expect(html).toContain("No pieces match these filters.");
    expect(html).toContain("Clear filters");
    expect(html).not.toContain("Nothing matches");
  });

  it("puts merchant featured pieces first in the default sort", () => {
    const html = renderToStaticMarkup(createElement(ShopCatalog, {
      products: [products[0], { ...products[3], featured: true }],
      commerceEnabled: false,
    }));
    expect(html.indexOf("<article>Paradise Lost Tee")).toBeLessThan(html.indexOf("<article>Caged Freedom Tee"));
  });

  it("shows saved pieces independently of stale shop filters", () => {
    navigation.query = "saved=1&category=hoodies&color=white&q=missing";
    wishlist.slugs = [products[0].slug];
    const html = render();
    expect(html).toContain("Wishlist");
    expect(html).toContain("1 saved piece");
    expect(html).toContain(products[0].name);
    expect(html).not.toContain(products[1].name);
    expect(html).not.toContain('class="catalog-filters"');
    expect(html).not.toContain("Ordering is not open yet");
  });

  it("shows a useful empty wishlist for unavailable saved products", () => {
    navigation.query = "saved=1";
    wishlist.slugs = ["no-longer-in-catalog"];
    const html = render();
    expect(html).toContain("Your wishlist is empty");
    expect(html).toContain('href="/shop"');
    expect(html).not.toContain('class="catalog-filters"');
  });

  it("waits for browser storage before showing the empty state", () => {
    navigation.query = "saved=1";
    wishlist.ready = false;
    const html = render();
    expect(html).toContain("Loading your wishlist");
    expect(html).not.toContain("Your wishlist is empty");
  });

  it("keeps wishlist tools collapsed on a small saved collection", () => {
    navigation.query = "saved=1";
    wishlist.slugs = [products[0].slug];
    const html = render();
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Search &amp; filter" hidden=""');
  });

  it("opens tools automatically for a larger wishlist without offering unavailable categories", () => {
    navigation.query = "saved=1";
    const expanded = Array.from({ length: 12 }, (_, index) => ({ ...products[index % products.length], id: `saved-${index}`, slug: `saved-${index}` }));
    wishlist.slugs = expanded.map(product => product.slug);
    const html = renderToStaticMarkup(createElement(ShopCatalog, { products: expanded, commerceEnabled: false }));
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("Search saved pieces");
    expect(html).toContain("Recently saved");
    expect(html).toContain("Showing 12 of 12 saved pieces");
    expect(html).not.toContain('option value="hoodies"');
  });
});
