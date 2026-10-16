import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { translations } from "@/lib/i18n";

vi.mock("motion/react", () => ({ useReducedMotion: () => true }));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en" }) }));
vi.mock("@/components/store-image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => createElement("img", { src, alt }) }));

import { CampaignHero } from "@/components/campaign-hero";

describe("campaign accessibility", () => {
  it("exposes only the current promotion and keeps inactive links out of keyboard navigation", () => {
    const html = renderToStaticMarkup(createElement(CampaignHero));
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html.match(/aria-hidden="false"/g)).toHaveLength(1);
    expect(html.match(/inert=""/g)).toHaveLength(2);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(2);
    const currentLink = html.match(/<a\b[^>]*>/g)?.find(tag => tag.includes('href="/shop"'));
    expect(currentLink).toContain('tabindex="0"');
  });
});
