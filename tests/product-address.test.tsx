import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { translations } from "@/lib/i18n";
import { automaticProductSlug, suffixedProductSlug, productAddressPolicy } from "@/lib/product-address";

vi.mock("@/app/admin/store-actions", () => ({ deleteProductAction: vi.fn(), saveProductAction: vi.fn(), saveProductSectionAction: vi.fn() }));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en }) }));
vi.mock("@/components/currency-provider", () => ({ useCurrency: () => ({ usdRate: .003 }) }));
vi.mock("@/components/control-room/store-shared", async importOriginal => ({
  ...await importOriginal<typeof import("@/components/control-room/store-shared")>(),
  useCrForm: () => ({ state: { status: "idle", message: "" }, formAction: () => {}, pending: false, onSubmit: () => {} }),
  DeleteForm: () => null,
}));

import { ProductForm } from "@/components/control-room/product-form";
import { ProductAddressField } from "@/components/control-room/product-address-field";

describe("product address generation and developer tools", () => {
  it("generates valid bounded addresses, including a fallback for names without Latin characters", () => {
    expect(automaticProductSlug("Caged Freedom Tee")).toBe("caged-freedom-tee");
    expect(automaticProductSlug("!!!")).toBe("product");
    const long = suffixedProductSlug(automaticProductSlug("a".repeat(120)), "a1b2c3");
    expect(long.length).toBeLessThanOrEqual(80);
    expect(long).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it("does not trust custom or regenerate flags from merchant roles", () => {
    for (const role of ["owner", "staff", "supporter", null] as const) expect(productAddressPolicy(role, "custom", true, true)).toEqual({ custom: false, preserve: true });
    expect(productAddressPolicy("web_dev", "auto", true, true).preserve).toBe(false);
  });
  it("hides the address field by default, while Web Dev receives Auto/Custom controls", () => {
    const owner = renderToStaticMarkup(createElement(ProductForm, { product: null, canManage: true }));
    expect(owner).not.toContain("Web address mode");
    expect(owner).not.toContain('name="slug"');
    const developer = renderToStaticMarkup(createElement(ProductForm, { product: null, canManage: true, canCustomizeAddress: true }));
    expect(developer).toContain('role="radiogroup"');
    expect(developer).toContain('name="slugMode"');
    expect(developer).toContain('value="auto"');
    expect(developer).toContain("Custom");
  });
  it("previews a generated address on create and preserves an existing link after a name change", () => {
    expect(renderToStaticMarkup(createElement(ProductAddressField, { name: "New Tee" }))).toContain("/shop/new-tee");
    const existing = renderToStaticMarkup(createElement(ProductAddressField, { name: "Renamed Tee", savedSlug: "original-tee" }));
    expect(existing).toContain("/shop/original-tee");
    expect(existing).toContain("Regenerate");
    expect(existing).not.toContain("/shop/renamed-tee");
  });
});
