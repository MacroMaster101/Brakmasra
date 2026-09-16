import { afterEach, describe, expect, it } from "vitest";

import { clientAddress, readJsonBody, trustedProxyProvider } from "@/lib/request";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe("request security helpers", () => {
  it("normalizes a valid header from the configured proxy", () => {
    const headers = new Headers({ "x-forwarded-for": "2001:DB8::1, 10.0.0.1" });
    expect(clientAddress(headers, "generic")).toBe("2001:db8::1");
  });

  it("rejects malformed or oversized client identifiers", () => {
    expect(clientAddress(new Headers({ "x-forwarded-for": "attacker-controlled" }), "generic")).toBe("unknown");
    expect(clientAddress(new Headers({ "x-forwarded-for": "1".repeat(65) }), "generic")).toBe("unknown");
  });

  it("reads only headers belonging to the configured provider", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.8",
      "x-vercel-forwarded-for": "192.0.2.10",
      "x-forwarded-for": "198.51.100.4",
    });
    expect(clientAddress(headers, "cloudflare")).toBe("203.0.113.8");
    expect(clientAddress(headers, "vercel")).toBe("192.0.2.10");
    expect(clientAddress(headers, "none")).toBe("unknown");
  });

  it("detects Vercel and otherwise defaults to trusting no proxy", () => {
    delete process.env.VERCEL;
    delete process.env.TRUSTED_PROXY_PROVIDER;
    expect(trustedProxyProvider()).toBe("none");

    process.env.VERCEL = "1";
    expect(trustedProxyProvider()).toBe("vercel");
  });

  it("parses only JSON bodies within the configured byte limit", async () => {
    const valid = new Request("https://store.example/api", {
      method: "POST",
      body: JSON.stringify({ item: "tee" }),
    });
    expect(await readJsonBody(valid, 64)).toEqual({ item: "tee" });

    const oversized = new Request("https://store.example/api", {
      method: "POST",
      body: JSON.stringify({ item: "x".repeat(100) }),
    });
    expect(await readJsonBody(oversized, 32)).toBeNull();
  });
});
