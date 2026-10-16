import { describe, expect, it, vi } from "vitest";

import sitemap from "@/app/sitemap";
import { products } from "@/data/products";
import { journalPosts } from "@/data/journal";

vi.mock("@/lib/content", () => ({ getPublicContent: async () => ({ pages: {}, posts: journalPosts }) }));
vi.mock("@/lib/store", () => ({ getCatalog: async () => products }));

describe("sitemap", () => {
  it("lists the store, about, and contact pages first", async () => {
    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(paths.slice(0, 4)).toEqual(["/", "/shop", "/about", "/contact"]);
  });

  it("includes legal, journal and published product destinations", async () => {
    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(paths.slice(4, 6)).toEqual(["/privacy", "/terms"]);
    expect(paths).toContain("/blog");
    for (const post of journalPosts) expect(paths).toContain(`/blog/${post.slug}`);
    for (const path of paths.slice(6)) expect(path).toMatch(/^\/(blog(?:\/[^/]+)?|shop\/[^/]+)$/);
  });
});
