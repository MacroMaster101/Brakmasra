import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { translations } from "@/lib/i18n";

const text = "See [terms](/terms), [mail](mailto:hello@example.com), [off](//evil.example), [slash](/\\evil.example) and [js](javascript:alert(1)).";

vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en" }) }));
vi.mock("@/components/content-provider", () => ({
  usePageCopy: () => ({ title: "Terms", lead: "Lead", sections: [{ id: "one", title: "One", blocks: [{ type: "p", text }] }] }),
}));

import { LegalView } from "@/components/legal-view";

describe("legal rich text", () => {
  it("links only site paths and mailto addresses", () => {
    const html = renderToStaticMarkup(createElement(LegalView, { document: "terms" }));
    const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(match => match[1]);
    expect(hrefs).toContain("/terms");
    expect(hrefs).toContain("mailto:hello@example.com");
    expect(hrefs.some(href => href.includes("evil.example"))).toBe(false);
    expect(hrefs.some(href => href.startsWith("javascript:"))).toBe(false);
  });
});
