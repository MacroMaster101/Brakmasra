import { describe, expect, it } from "vitest";

import { resolveAuthDemoMode, resolveLaunchMode } from "@/lib/features";

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
});
