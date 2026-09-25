import { describe, expect, it } from "vitest";

import { resolveAuthDemoMode, resolveAuthEnabled, resolveLaunchMode } from "@/lib/features";

describe("launch configuration", () => {
  it("fails closed unless launch mode is explicitly off", () => {
    expect(resolveLaunchMode(undefined)).toBe(true);
    expect(resolveLaunchMode("on")).toBe(true);
    expect(resolveLaunchMode(" OFF ")).toBe(false);
  });

  it("allows demo auth only outside production", () => {
    expect(resolveAuthDemoMode("on", "development")).toBe(true);
    expect(resolveAuthDemoMode("on", "test")).toBe(true);
    expect(resolveAuthDemoMode("on", "production")).toBe(false);
    expect(resolveAuthDemoMode("", "development")).toBe(false);
  });

  it("opens member sign-in independently of the store launch gate", () => {
    const base = { demoMode: false, launchMode: true, supabaseConfigured: true };
    expect(resolveAuthEnabled({ ...base, authMode: undefined })).toBe(false);
    expect(resolveAuthEnabled({ ...base, authMode: " ON " })).toBe(true);
    expect(resolveAuthEnabled({ ...base, authMode: undefined, launchMode: false })).toBe(true);
    expect(resolveAuthEnabled({ ...base, authMode: "off", launchMode: false })).toBe(false);
  });

  it("keeps sign-in closed until Supabase is configured, except in demo mode", () => {
    const base = { authMode: "on", launchMode: true, supabaseConfigured: false };
    expect(resolveAuthEnabled({ ...base, demoMode: false })).toBe(false);
    expect(resolveAuthEnabled({ ...base, demoMode: true })).toBe(true);
  });
});
