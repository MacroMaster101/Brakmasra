import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { products } from "@/data/products";
import { formatMoney } from "@/lib/cart";
import { translations } from "@/lib/i18n";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/cart-provider", () => ({ useCart: () => ({ add: vi.fn() }) }));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en" }) }));
vi.mock("@/components/currency-provider", () => ({ useCurrency: () => ({ formatPrice: formatMoney }) }));
vi.mock("@/components/currency-switcher", () => ({ CurrencyConversionNote: () => null }));
vi.mock("@/lib/wishlist", () => ({ useWishlist: () => ({ slugs: [], toggle: vi.fn() }) }));
vi.mock("@/components/product-card", () => ({ ProductCard: ({ product }: { product: { name: string } }) => createElement("article", null, product.name) }));
import { ProductDetails } from "@/components/product-details";
import { AddToCart } from "@/components/add-to-cart";

describe("product purchase and information", () => {
  it("keeps size and colour selection required and quantity stock bounded", () => {
    const html = renderToStaticMarkup(createElement(AddToCart, { product: { ...products[0], stock: 3 } }));
    const inputs = html.match(/<input\b[^>]*>/g) ?? [];
    expect(inputs.find(input => input.includes('name="size"') && input.includes('value="S"'))).toContain('required=""');
    expect(inputs.find(input => input.includes('name="color"'))).toContain('required=""');
    expect(html).toContain('max="3"');
    const buttons = html.match(/<button\b[^>]*>/g) ?? [];
    expect(buttons.find(button => button.includes('value="cart"'))).toContain('type="submit"');
    expect(buttons.find(button => button.includes('value="checkout"'))).toContain('type="submit"');
  });
  it("does not offer either purchase action for an out-of-stock product", () => {
    const html = renderToStaticMarkup(createElement(AddToCart, { product: { ...products[0], stock: 0 } }));
    expect(html).toContain("Sold out");
    expect(html).not.toContain('type="submit"');
  });
  it("preserves the launch gate for purchase controls", () => {
    const html = renderToStaticMarkup(createElement(ProductDetails, { product: products[0], commerceEnabled: false }));
    expect(html).not.toContain('name="intent"');
    expect(html).toContain("Coming soon");
  });
  it("uses actual product information and related catalogue products", () => {
    const html = renderToStaticMarkup(createElement(ProductDetails, { product: products[0], related: products.slice(1, 3), commerceEnabled: true }));
    expect(html).toContain(products[0].fabric);
    expect(html).toContain(products[0].care[0]);
    expect(html).toContain(products[1].name);
    expect(html).toContain('href="/terms#store"');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
    expect(html).not.toContain("people are viewing");
    expect(html).not.toContain("30 day money back");
  });
  it("handles a future product without photographs or optional variants", () => {
    const html = renderToStaticMarkup(createElement(ProductDetails, { product: { ...products[0], images: [], sizes: [], colors: [] }, commerceEnabled: false }));
    expect(html).toContain("Photo coming soon");
    expect(html).not.toContain('class="pdp-gallery-prev"');
  });
});
