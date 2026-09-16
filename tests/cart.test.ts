import { describe, expect, it } from "vitest";
import { cartCount, cartSubtotal, formatMoney, parseStoredCart, type CartLine } from "@/lib/cart";

const lines: CartLine[] = [{
  productId: "1",
  slug: "hoodie",
  name: "Hoodie",
  image: "/images/hoodie.jpg",
  size: "L",
  color: "Black",
  quantity: 2,
  unitPrice: 5000,
  currency: "LKR",
}];

describe("cart helpers", () => {
  it("calculates count and subtotal in minor units", () => {
    expect(cartCount(lines)).toBe(2);
    expect(cartSubtotal(lines)).toBe(10000);
  });

  it("formats minor units without exposing floating-point math", () => {
    expect(formatMoney(10000, "USD")).toContain("100.00");
  });

  it("rejects malformed or oversized persisted carts", () => {
    expect(parseStoredCart("not json")).toEqual([]);
    expect(parseStoredCart(JSON.stringify([{ quantity: 1 }]))).toEqual([]);
    expect(parseStoredCart(JSON.stringify(Array.from({ length: 101 }, () => lines[0])))).toEqual([]);
    expect(parseStoredCart(JSON.stringify(lines))).toEqual(lines);
  });
});
