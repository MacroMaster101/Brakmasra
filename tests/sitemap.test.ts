import { describe, expect, it, vi } from "vitest";

import sitemap from "@/app/sitemap";
import { products } from "@/data/products";

vi.mock("@/lib/store", () => ({ getCatalog: async () => products }));

describe("sitemap", () => {
  it("lists the store, about, and contact pages first", async () => {
    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(paths.slice(0, 4)).toEqual(["/", "/shop", "/about", "/contact"]);
  });

  it("follows them with the legal pages, then only product pages", async () => {
    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(paths.slice(4, 6)).toEqual(["/privacy", "/terms"]);
    for (const path of paths.slice(6)) expect(path).toMatch(/^\/shop\/[^/]+$/);
  });
});
