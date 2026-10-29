import { describe, expect, it } from "vitest";
import { alternatePrices, priceInCurrency, compareProductPrices, salePriceMinor } from "@/lib/product-pricing";
import { productSchema, productFormValues, productSectionSchemas } from "@/lib/store-admin-validation";
import { productFromRow, type ProductRow } from "@/lib/store-mapping";
import { buildCheckoutQuote, checkoutSchema, type QuoteProduct } from "@/lib/checkout-quote";
import { cartSubtotalInCurrency } from "@/lib/cart-currency";
const id = "32149a77-c59f-4ee3-a45d-931fdd3ea0f0";
const variantId = "00000000-0000-4000-8000-000000000001";
const product: QuoteProduct = { id, name: "Tee", status: "active", currency: "USD", price_minor: 2500, discount_kind: "percent", discount_value: 10, product_variants: [{ id: variantId, size: "M", color: "Black", inventory: 5, active: true }] };
const cart = { currency: "USD" as const, lines: [{ productId: id, size: "M", color: "Black", quantity: 2 }] };
describe("product sale pricing", () => {
  it("applies percentage and fixed discounts in minor units and rejects unsafe legacy values", () => {
    expect(salePriceMinor(2500, "percent", 10)).toBe(2250);
    expect(salePriceMinor(2500, "fixed", 500)).toBe(2000);
    for (const value of [-1, 0, 3000, NaN]) expect(salePriceMinor(2500, "fixed", value)).toBe(2500);
    expect(salePriceMinor(2500, "percent", 100)).toBe(2500);
  });
  it("validates USD and LKR pricing separately from other product sections", () => {
    const form = new FormData(); Object.entries({ price: "25", currency: "USD", discountKind: "fixed", discountValue: "5" }).forEach(([key, value]) => form.set(key,value));
    expect(productSectionSchemas.pricing.parse(productFormValues(form))).toEqual({ price: 2500, currency: "USD", alternatePrice: null, discountKind: "fixed", discountValue: 500 });
    expect(productSectionSchemas.pricing.safeParse({ price: "6900", currency: "LKR", discountKind: "percent", discountValue: "15" }).success).toBe(true);
  });
  it("rejects unsupported currencies, zero sale prices, invalid percentages and oversized discounts", () => {
    const base = { price: "25", currency: "USD", discountKind: "fixed", discountValue: "5" };
    for (const patch of [{ currency: "EUR" }, { discountValue: "25" }, { discountValue: "-1" }, { discountKind: "percent", discountValue: "100" }, { discountKind: "percent", discountValue: "10.5" }, { price: "0.01", discountKind: "percent", discountValue: "99" }]) expect(productSectionSchemas.pricing.safeParse({ ...base, ...patch }).success).toBe(false);
    expect(productSchema.safeParse({}).success).toBe(false);
  });
  it("maps the sale price, regular price and sale badge into the public catalog", () => {
    const mapped = productFromRow({ ...product, slug: "tee", description: "A tee", fabric: null, care: [], category: "Apparel", badge: "NEW", coming_soon: false, featured: false, si_description: null, si_fabric: null, si_care: [] } as ProductRow, undefined);
    expect(mapped.price).toBe(2250); expect(mapped.compareAtPrice).toBe(2500); expect(mapped.badge).toBe("SALE"); expect(mapped.currency).toBe("USD");
  });
});
describe("checkout currency quotes", () => {
  it("compares shop prices in a common currency", () => {
    expect(compareProductPrices({ price: 2500, currency: "USD" }, { price: 690000, currency: "LKR" }, .003)).toBeGreaterThan(0);
    expect(compareProductPrices({ price: 2000, currency: "USD" }, { price: 690000, currency: "LKR" }, .003)).toBeLessThan(0);
  });
  it("quotes the same discounted product in either currency using trusted product amounts", () => {
    expect(buildCheckoutQuote(cart, [product], null)).toMatchObject({ currency: "USD", subtotalMinor: 4500, lines: [{ unitPriceMinor: 2250, totalMinor: 4500 }] });
    expect(buildCheckoutQuote({ ...cart, currency: "LKR" }, [product], .003)).toMatchObject({ currency: "LKR", subtotalMinor: 1500000 });
  });
  it("does not trust browser prices, discounts or exchange rates", () => {
    const parsed = checkoutSchema.parse({ ...cart, price: 1, usdRate: 999, lines: [{ ...cart.lines[0], unitPrice: 1, discount: 99 }] });
    expect(buildCheckoutQuote(parsed, [product], null).subtotalMinor).toBe(4500);
    expect(parsed).not.toHaveProperty("usdRate");
  });
  it("combines repeated variants before checking quantity and stock", () => {
    expect(() => buildCheckoutQuote({ ...cart, lines: [{ ...cart.lines[0], quantity: 3 }, { ...cart.lines[0], quantity: 3 }] }, [product], null)).toThrow(/stock/);
    expect(buildCheckoutQuote({ ...cart, lines: [cart.lines[0], cart.lines[0]] }, [product], null).lines).toHaveLength(1);
  });
  it("fails closed on missing rates, inactive products, unavailable variants and stock shortages", () => {
    expect(() => buildCheckoutQuote({ ...cart, currency: "LKR" }, [product], null)).toThrow(/conversion/);
    for (const patch of [{ status: "draft" }, { coming_soon: true }, { product_variants: [] }, { product_variants: [{ ...product.product_variants[0], inventory: 1 }] }]) expect(() => buildCheckoutQuote(cart, [{ ...product, ...patch }], null)).toThrow(/unavailable/);
    expect(checkoutSchema.safeParse({ ...cart, currency: "EUR" }).success).toBe(false);
  });
  it("sums mixed-currency carts only after conversion and rounds each unit before multiplying", () => {
    const lines = [{ productId: id, slug: "tee", name: "Tee", image: "/images/a.webp", size: "M", color: "Black", quantity: 2, unitPrice: 2250, currency: "USD" }, { productId: "other", slug: "other", name: "Other", image: "/images/a.webp", size: "M", color: "Black", quantity: 3, unitPrice: 100000, currency: "LKR" }];
    expect(cartSubtotalInCurrency(lines, "USD", .003)).toBe(5400);
    expect(cartSubtotalInCurrency(lines, "LKR", .003)).toBe(1800000);
    expect(cartSubtotalInCurrency(lines, "USD", null)).toBeNull();
    expect(cartSubtotalInCurrency([{ ...lines[0], unitPrice: 105, quantity: 3, currency: "LKR" }], "USD", .015)).toBe(6);
  });
});

describe("custom LKR and USD prices", () => {
  it("auto-converts LKR 2,000 and uses custom prices without an exchange rate", () => {
    expect(priceInCurrency(200000, "LKR", "USD", .003)).toBe(600);
    expect(priceInCurrency(200000, "LKR", "USD", null)).toBeNull();
    expect(priceInCurrency(200000, "LKR", "USD", null, { USD: 800 })).toBe(800);
    expect(priceInCurrency(200000, "LKR", "USD", .003, { USD: 800 })).toBe(800);
    expect(priceInCurrency(200000, "LKR", "USD", .003, { USD: -1 })).toBe(600);
  });
  it("validates custom prices, and clears an override explicitly when automatic mode is restored", () => {
    const base = { price: "2000", currency: "LKR", discountKind: "none", discountValue: "" };
    expect(productSectionSchemas.pricing.parse({ ...base, alternatePrice: "8.50" }).alternatePrice).toBe(850);
    expect(productSectionSchemas.pricing.parse({ ...base, alternatePrice: "" }).alternatePrice).toBeNull();
    for (const alternatePrice of ["0", "-1", "8.555", "1000001", "not money"]) expect(productSectionSchemas.pricing.safeParse({ ...base, alternatePrice }).success).toBe(false);
    expect(productSectionSchemas.pricing.safeParse({ ...base, price: "0", alternatePrice: "8" }).success).toBe(false);
    expect(productSectionSchemas.pricing.safeParse({ ...base, alternatePrice: "0.01", discountKind: "percent", discountValue: "99" }).success).toBe(false);
  });
  it("carries the same sale proportion through catalog, cart and authoritative checkout quotes", () => {
    const custom = { ...product, currency: "LKR", price_minor: 200000, alternate_price_minor: 800, discount_kind: "fixed", discount_value: 20000 };
    const prices = alternatePrices(200000, 180000, "LKR", 800);
    expect(prices).toEqual({ prices: { USD: 720 }, compareAtPrices: { USD: 800 } });
    // Percentage discounts use the actual percentage, not the rounded base price ratio.
    expect(alternatePrices(101, 96, "LKR", 50, "percent", 5).prices?.USD).toBe(47);
    const mapped = productFromRow({ ...custom, slug: "tee", description: "A tee", fabric: null, care: [], category: "Apparel", badge: "NEW", coming_soon: false, featured: false, si_description: null, si_fabric: null, si_care: [] } as ProductRow, undefined);
    expect(mapped.prices).toEqual({ USD: 720 });
    expect(mapped.compareAtPrices).toEqual({ USD: 800 });
    expect(buildCheckoutQuote(cart, [custom], null).subtotalMinor).toBe(1440);
    expect(buildCheckoutQuote({ ...cart, currency: "LKR" }, [custom], null).subtotalMinor).toBe(360000);
    expect(cartSubtotalInCurrency([{ productId: id, slug: "tee", name: "Tee", image: "/images/a.webp", size: "M", color: "Black", quantity: 2, unitPrice: mapped.price, currency: mapped.currency, prices: mapped.prices }], "USD", null)).toBe(1440);
  });
  it("sorts by the customer's selected currency, including custom prices", () => {
    const first = { price: 200000, currency: "LKR", prices: { USD: 900 } };
    const second = { price: 250000, currency: "LKR", prices: { USD: 800 } };
    expect(compareProductPrices(first, second, null, "LKR")).toBeLessThan(0);
    expect(compareProductPrices(first, second, null, "USD")).toBeGreaterThan(0);
  });
});
