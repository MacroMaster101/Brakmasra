import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

async function headerMap() {
  const rules = (await nextConfig.headers?.()) ?? [];
  return new Map(rules[0].headers.map((header) => [header.key, header.value]));
}

describe("security headers", () => {
  it("keeps the CSP locked to this origin with no YouTube hosts", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("img-src 'self' data:;");
    expect(csp).not.toMatch(/youtube|ytimg|yt3|googleapis/);
  });

  it("keeps the hardening headers", async () => {
    const headers = await headerMap();
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=(), payment=(self)");
  });

  it("allows no remote image hosts", () => {
    expect(nextConfig.images?.remotePatterns).toBeUndefined();
  });
});
