import { afterEach, describe, expect, it } from "vitest";

import { getAuthCallbackUrl, getAuthEnvironment, getSiteUrl, isStaffRole, safeRedirectPath } from "@/lib/auth";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe("authentication helpers", () => {
  it("accepts only same-site redirect paths", () => {
    expect(safeRedirectPath("/account")).toBe("/account");
    expect(safeRedirectPath("/shop/unknown-mark-tee")).toBe("/shop/unknown-mark-tee");
    expect(safeRedirectPath("https://malicious.example")).toBe("/account");
    expect(safeRedirectPath("//malicious.example")).toBe("/account");
    expect(safeRedirectPath("/\\malicious.example")).toBe("/account");
    expect(safeRedirectPath("/%5cmalicious.example")).toBe("/account");
    expect(safeRedirectPath("/%255cmalicious.example")).toBe("/account");
    expect(safeRedirectPath("/%2f%2fmalicious.example")).toBe("/account");
    expect(safeRedirectPath("/account\u0000", "/login")).toBe("/login");
    expect(safeRedirectPath(null, "/login")).toBe("/login");
  });

  it("recognizes only server-controlled staff roles", () => {
    expect(isStaffRole("admin")).toBe(true);
    expect(isStaffRole("staff")).toBe(true);
    expect(isStaffRole("support")).toBe(false);
    expect(isStaffRole("supporter")).toBe(false);
    expect(isStaffRole("editor")).toBe(false);
    expect(isStaffRole("customer")).toBe(false);
    expect(isStaffRole(null)).toBe(false);
  });

  it("normalizes the configured site origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://store.example/path";
    expect(getSiteUrl()).toBe("https://store.example");
  });

  it("builds a same-site authentication callback", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://store.example/path";
    expect(getAuthCallbackUrl("/account?welcome=1")).toBe(
      "https://store.example/auth/confirm?next=%2Faccount%3Fwelcome%3D1",
    );
    expect(getAuthCallbackUrl("https://malicious.example")).toBe(
      "https://store.example/auth/confirm?next=%2Faccount",
    );
  });

  it("requires the public Supabase auth credentials", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    expect(getAuthEnvironment()).toEqual({
      publishableKey: "publishable-key",
      url: "https://example.supabase.co",
    });

    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    expect(() => getAuthEnvironment()).toThrow("Supabase Auth is not configured.");
  });
});
