import { describe, expect, it } from "vitest";
import { cartCount, cartSubtotal, formatMoney, type CartLine } from "@/lib/cart";

const lines: CartLine[] = [{ productId: "1", slug: "hoodie", name: "Hoodie", image: "/hoodie.jpg", size: "L", color: "Black", quantity: 2, unitPrice: 5000, currency: "LKR" }];

describe("cart helpers", () => {
  it("calculates count and subtotal in minor units", () => {
    expect(cartCount(lines)).toBe(2);
    expect(cartSubtotal(lines)).toBe(10000);
  });

  it("formats minor units without exposing floating-point math", () => {
    expect(formatMoney(10000, "USD")).toContain("100.00");
  });
});
