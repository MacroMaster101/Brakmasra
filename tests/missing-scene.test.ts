import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { translations } from "@/lib/i18n";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en" }) }));
vi.mock("@/components/language-switcher", () => ({ LanguageSwitcher: () => null }));
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }));
vi.mock("@/components/store-image", () => ({ default: ({ alt, src }: { alt: string; src: string }) => createElement("img", { alt, src }) }));

import ErrorPage from "@/app/error";
import { NotFoundScene } from "@/components/not-found-scene";

const t = translations.en;

beforeEach(() => {
  route.pathname = "/";
});

describe("404 and error scenes", () => {
  it("shows the store 404 on store pages", () => {
    route.pathname = "/shop/missing-tee";
    const html = renderToStaticMarkup(createElement(NotFoundScene, { staff: true }));
    expect(html).toContain(t.notFoundTitle);
    expect(html).toContain('href="/shop"');
  });

  it("gives staff a way back to the dashboard from a missing Control Room page", () => {
    route.pathname = "/admin/products/unknown";
    const html = renderToStaticMarkup(createElement(NotFoundScene, { staff: true }));
    expect(html).toContain(t.notFoundAdminTitle.replace("'", "&#x27;"));
    expect(html).toContain('href="/admin"');
  });

  it("never mentions the Control Room to anyone else", () => {
    route.pathname = "/admin";
    const html = renderToStaticMarkup(createElement(NotFoundScene, { staff: false }));
    expect(html).toContain(t.notFoundTitle);
    expect(html).not.toContain('href="/admin"');
  });

  it("keeps the big numerals out of the screen-reader reading order", () => {
    const html = renderToStaticMarkup(createElement(NotFoundScene, { staff: false }));
    expect(html).toMatch(/<svg class="missing-code"[^>]*aria-hidden="true"/);
    expect(html).not.toContain('role="img"');
    expect(html).toContain("404-streetwear-hq-4k.webp");
    expect(html).not.toContain(".gif");
  });

  it("uses the same scene, with 500 numerals, for broken pages", () => {
    route.pathname = "/admin/orders";
    const html = renderToStaticMarkup(createElement(ErrorPage, { reset: () => {} }));
    expect(html).toContain('class="storefront-not-found"');
    expect(html).toContain(t.errorTitle);
    expect(html).toContain(t.errorAdminDesc);
    expect(html).toContain('href="/admin"');
    expect(html).toContain('transform="translate(400)"');
  });
});
