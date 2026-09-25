import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("lists the store, about, and contact pages first", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(paths.slice(0, 4)).toEqual(["/", "/shop", "/about", "/contact"]);
  });

  it("follows them with the legal pages, then only product pages", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(paths.slice(4, 6)).toEqual(["/privacy", "/terms"]);
    for (const path of paths.slice(6)) expect(path).toMatch(/^\/shop\/[^/]+$/);
  });
});
