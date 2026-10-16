import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { translations } from "@/lib/i18n";
import { formatMoney, type CartLine } from "@/lib/cart";

const state = vi.hoisted(() => ({ hydrated: true, lines: [] as CartLine[], update: vi.fn(), remove: vi.fn() }));
vi.mock("@/components/cart-provider", () => ({ useCart: () => state }));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en }) }));
vi.mock("@/components/currency-provider", () => ({ useCurrency: () => ({ formatPrice: formatMoney }) }));
vi.mock("@/components/currency-switcher", () => ({ CurrencyConversionNote: () => null }));
import { CartView } from "@/components/cart-view";

const item: CartLine = { productId: "cart-tee", slug: "cart-tee", name: "Cart Tee", image: "/images/models/caged-freedom.webp", size: "L", color: "Washed black", quantity: 1, unitPrice: 690000, currency: "LKR" };
const render = () => renderToStaticMarkup(createElement(CartView));

describe("cart presentation", () => {
  beforeEach(() => { state.hydrated = true; state.lines = []; });
  it("shows a shop action rather than checkout when empty", () => {
    const html = render();
    expect(html).toContain("Your cart is empty");
    expect(html).toContain('href="/shop"');
    expect(html).not.toContain('href="/checkout"');
    expect(html).not.toContain("preview collection");
  });
  it("waits for browser cart hydration before showing an empty state", () => {
    state.hydrated = false;
    const html = render();
    expect(html).toContain("Loading your cart");
    expect(html).not.toContain("Your cart is empty");
  });
  it("shows variant details, correct quantity totals and checkout navigation", () => {
    state.lines = [{ ...item, quantity: 2 }, { ...item, productId: "second", slug: "second", name: "Second Tee", unitPrice: 200000, quantity: 3 }];
    const html = render();
    expect(html).toContain("5 items");
    expect(html).toContain("L / Washed black");
    expect(html).toContain(formatMoney(1980000, "LKR"));
    expect(html).toContain(formatMoney(1380000, "LKR"));
    expect(html).toContain('href="/shop/cart-tee"');
    expect(html).toContain('href="/checkout"');
    expect(html).toContain("Shipping and taxes are confirmed at checkout.");
  });
  it("names each control by product and disables quantities at the supported bounds", () => {
    state.lines = [item, { ...item, productId: "limit", slug: "limit", name: "Limit Tee", quantity: 10 }];
    const html = render();
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Decrease quantity: Cart Tee"/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Increase quantity: Limit Tee"/);
    expect(html).toContain('aria-label="Remove Cart Tee"');
    expect(html).toContain('aria-label="Quantity for Cart Tee"');
  });
});
