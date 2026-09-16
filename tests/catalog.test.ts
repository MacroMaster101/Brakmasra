import { describe, expect, it } from "vitest";
import type { Product } from "@/data/products";
import { findProduct, searchProducts, toCartLine } from "@/lib/catalog";

// Test fixtures only — never copy these into data/products.ts.
const hoodie: Product = {
  id: "3f2b7c1e-8a4d-4b6f-9c2e-1d5a7b9e0f11",
  slug: "sigil-hoodie",
  name: "Sigil Hoodie",
  description: "Heavyweight black hoodie with the BRAKMASRA sigil.",
  price: 850000,
  currency: "LKR",
  images: ["/products/sigil-hoodie/front.jpg"],
  sizes: ["M", "L"],
  colors: ["Black"],
  fabric: "Cotton fleece",
  care: ["Cold wash"],
  stock: 3,
};
const cap: Product = {
  ...hoodie,
  id: "9a1c3e5f-2b4d-4c6e-8f0a-b1c2d3e4f5a6",
  slug: "night-cap",
  name: "Night Cap",
  description: "Embroidered cap.",
  images: ["/products/night-cap/front.jpg"],
  sizes: [],
};
const list = [hoodie, cap];

describe("catalog helpers", () => {
  it("finds a product by slug", () => {
    expect(findProduct("sigil-hoodie", list)).toBe(hoodie);
    expect(findProduct("missing", list)).toBeUndefined();
  });

  it("searches name and description case-insensitively", () => {
    expect(searchProducts("SIGIL", list)).toEqual([hoodie]);
    expect(searchProducts("embroidered", list)).toEqual([cap]);
    expect(searchProducts("   ", list)).toEqual(list);
  });

  it("builds a cart line for a valid in-stock variant", () => {
    expect(toCartLine(hoodie, { size: "L", color: "Black", quantity: 2 })).toEqual({
      productId: hoodie.id,
      slug: "sigil-hoodie",
      name: "Sigil Hoodie",
      image: "/products/sigil-hoodie/front.jpg",
      size: "L",
      color: "Black",
      quantity: 2,
      unitPrice: 850000,
      currency: "LKR",
    });
  });

  it("accepts an empty size for one-size products", () => {
    expect(toCartLine(cap, { size: "", color: "Black", quantity: 1 })?.size).toBe("");
  });

  it("rejects unknown variants and impossible quantities", () => {
    expect(toCartLine(hoodie, { size: "XXL", color: "Black", quantity: 1 })).toBeNull();
    expect(toCartLine(hoodie, { size: "L", color: "Red", quantity: 1 })).toBeNull();
    expect(toCartLine(hoodie, { size: "L", color: "Black", quantity: 4 })).toBeNull();
    expect(toCartLine(hoodie, { size: "L", color: "Black", quantity: 0 })).toBeNull();
    expect(toCartLine(hoodie, { size: "L", color: "Black", quantity: 1.5 })).toBeNull();
    expect(toCartLine({ ...hoodie, stock: 0 }, { size: "L", color: "Black", quantity: 1 })).toBeNull();
  });

  it("rejects products without a photo", () => {
    expect(toCartLine({ ...hoodie, images: [] }, { size: "L", color: "Black", quantity: 1 })).toBeNull();
  });
});
