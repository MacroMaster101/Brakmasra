import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LEGAL_UPDATED, legalDocuments } from "@/data/legal";
import { site } from "@/data/site";

const documents = Object.entries(legalDocuments);

function allText(blocks: { type: string; text?: string; items?: string[] }[]) {
  return blocks.flatMap((block) => (block.type === "list" ? block.items ?? [] : [block.text ?? ""]));
}

describe("legal pages", () => {
  it("has a valid last-updated date", () => {
    expect(Number.isNaN(new Date(LEGAL_UPDATED).getTime())).toBe(false);
  });

  it.each(documents)("keeps the %s sections identical across languages", (_id, byLanguage) => {
    expect(byLanguage.si.sections.map((section) => section.id)).toEqual(byLanguage.en.sections.map((section) => section.id));
    for (const language of [byLanguage.en, byLanguage.si]) {
      for (const section of language.sections) expect(section.blocks.length, section.id).toBeGreaterThan(0);
    }
  });

  it.each(documents)("links the %s page only to site pages and the support inbox", (_id, byLanguage) => {
    for (const language of [byLanguage.en, byLanguage.si]) {
      const text = language.sections.flatMap((section) => allText(section.blocks)).join("\n");
      for (const [, label, href] of text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
        if (href.startsWith("mailto:")) {
          expect(href).toBe(`mailto:${site.supportEmail}`);
          expect(label).toBe(site.supportEmail);
          continue;
        }
        expect(href).toMatch(/^\/[a-z-]*$/);
        expect(existsSync(join(process.cwd(), "app", href, "page.tsx")), href).toBe(true);
      }
    }
  });
});
