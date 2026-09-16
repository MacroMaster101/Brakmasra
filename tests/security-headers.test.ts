import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { createContentSecurityPolicy } from "@/lib/security-headers";

async function headerMap() {
  const rules = (await nextConfig.headers?.()) ?? [];
  return new Map(rules[0].headers.map((header) => [header.key, header.value]));
}

describe("security headers", () => {
  it("uses a nonce-based production CSP without unsafe inline scripts", () => {
    const csp = createContentSecurityPolicy("test-nonce", "production");
    const scriptDirective = csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src "));

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("img-src 'self' data:;");
    expect(csp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(scriptDirective).not.toContain("'unsafe-eval'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).not.toMatch(/youtube|ytimg|yt3|googleapis/);
  });

  it("permits only the development runtime exceptions in development", () => {
    const csp = createContentSecurityPolicy("test-nonce", "development");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
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
