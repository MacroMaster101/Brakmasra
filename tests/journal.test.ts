import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getJournalPost, journalPosts } from "@/data/journal";
import { products } from "@/data/products";

describe("journal destinations", () => {
  it("rejects unknown slugs, including object property names", () => {
    for (const slug of ["missing-story", "constructor", "__proto__", "../about"]) expect(getJournalPost(slug)).toBeUndefined();
  });

  it("has unique routes with existing images and product destinations", () => {
    expect(new Set(journalPosts.map((post) => post.slug)).size).toBe(journalPosts.length);
    for (const post of journalPosts) {
      expect(post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(getJournalPost(post.slug)).toBe(post);
      expect(existsSync(join(process.cwd(), "public", post.image))).toBe(true);
      expect(products.some((product) => product.slug === post.productSlug)).toBe(true);
    }
  });

  it("provides complete English and Sinhala reading content", () => {
    for (const post of journalPosts) {
      for (const lang of ["en", "si"] as const) {
        const copy = post.copy[lang];
        expect(copy.title.trim()).not.toBe("");
        expect(copy.imageAlt.trim()).not.toBe("");
        expect(copy.lead.trim()).not.toBe("");
        expect(copy.sections.length).toBeGreaterThan(0);
        for (const section of copy.sections) {
          expect(section.heading.trim()).not.toBe("");
          expect(section.paragraphs.every((paragraph) => paragraph.trim().length > 0)).toBe(true);
        }
      }
    }
  });
});
