import { describe, expect, it } from "vitest";
import { buildShopMenu, matchesShopCategory } from "@/data/shop-menu";
import { products } from "@/data/products";

describe("shop category navigation", () => {
  it("offers launch tees and links upcoming categories to their preview views", () => {
    const menu = buildShopMenu(products);
    expect(menu.categories.find((item) => item.id === "tees")?.available).toBe(true);
    expect(menu.categories.filter((item) => item.id !== "tees").every((item) => !item.available && item.href.includes("category="))).toBe(true);
  });
  it("keeps the original black and white collection cards with matching photographs", () => {
    const menu = buildShopMenu(products);
    expect(menu.cards.map((card) => card.color)).toEqual(["black", "white"]);
    expect(menu.cards[0].image).toBe(products.find((item) => item.slug === "caged-freedom-tee")?.images[0]);
    expect(menu.cards[1].image).toBe(products.find((item) => item.slug === "paradise-lost-tee")?.images[0]);
    expect(menu.cards.every((card) => card.href?.includes(`color=${card.color}`))).toBe(true);
  });
  it("activates a future category only when matching catalogue items exist", () => {
    const hoodie = { ...products[0], name: "After Hours Hoodie", colors: ["Black"] };
    const menu = buildShopMenu([hoodie]);
    expect(menu.categories.find((item) => item.id === "hoodies")?.available).toBe(true);
    expect(menu.categories.find((item) => item.id === "tees")?.available).toBe(false);
    expect(menu.cards.every((card) => card.href === null)).toBe(true);
    expect(matchesShopCategory(hoodie, "hoodies")).toBe(true);
    expect(matchesShopCategory(hoodie, "tees")).toBe(false);
  });
  it("handles an empty catalogue without suggesting available stock", () => {
    const menu = buildShopMenu([]);
    expect(menu.categories.every((item) => !item.available)).toBe(true);
    expect(menu.cards.every((item) => item.href === null)).toBe(true);
  });
  it("filters by product type rather than colour or artwork description", () => {
    const cap = { ...products[0], name: "Studio Cap", category: "Headwear" as const };
    expect(matchesShopCategory(cap, "headwear")).toBe(true);
    expect(matchesShopCategory(cap, "tees")).toBe(false);
    expect(matchesShopCategory({ ...products[0], name: "Canvas Tote Bag" }, "bags")).toBe(true);
    expect(matchesShopCategory(products[0], "unknown")).toBe(false);
  });
});
