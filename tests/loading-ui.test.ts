import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(route.query) }));
vi.mock("@/components/language-provider", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ t: translations.en, lang: "en" }) };
});
import { AuthLoadingState, CartLoadingState, DashboardLoadingState, HomeLoadingState, ProductLoadingState, ShopLoadingState } from "@/components/loading-states";
describe("storefront loading states", () => {
  it("uses an accessible navigation indicator without a photo or a simulated content page", () => {
    const html = renderToStaticMarkup(createElement(HomeLoadingState));
    expect(html).toContain('role="status"'); expect(html).toContain('aria-busy="true"'); expect(html).toContain("Loading…");
    expect(html).not.toContain("loading-block"); expect(html).not.toContain("<img"); expect(html).not.toContain("brakmasra-hero");
  });
  it("checks sign-in before showing any model photo or pretend form fields", () => {
    const html = renderToStaticMarkup(createElement(AuthLoadingState));
    expect(html).toContain("BRAKMASRA"); expect(html).toContain('href="/"'); expect(html).not.toContain("<img"); expect(html).not.toContain("loading-block");
  });
  it("keeps predictive skeletons for product, cart and dashboard data", () => {
    for (const element of [createElement(ProductLoadingState, {}), createElement(CartLoadingState, {}), createElement(DashboardLoadingState)]) {
      const html = renderToStaticMarkup(element);
      expect(html).toContain('aria-hidden="true"'); expect(html).toContain('aria-busy="true"'); expect(html).toContain("loading-block"); expect(html).not.toContain("<img");
    }
  });
  it("uses a grid for the shop but a quiet indicator for saved and upcoming destinations", () => {
    route.query = ""; expect(renderToStaticMarkup(createElement(ShopLoadingState))).toContain("loading-product-grid");
    for (const query of ["saved=1", "category=hoodies", "category=bags"]) { route.query=query; expect(renderToStaticMarkup(createElement(ShopLoadingState))).not.toContain("loading-product-grid"); }
  });
});
