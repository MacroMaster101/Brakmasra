import { describe, expect, it } from "vitest";

import { clientAddress, readJsonBody } from "@/lib/request";

describe("request security helpers", () => {
  it("normalizes a valid proxy-provided client address", () => {
    const headers = new Headers({ "x-forwarded-for": "2001:DB8::1, 10.0.0.1" });
    expect(clientAddress(headers)).toBe("2001:db8::1");
  });

  it("rejects malformed or oversized client identifiers", () => {
    expect(clientAddress(new Headers({ "x-forwarded-for": "attacker-controlled" }))).toBe("unknown");
    expect(clientAddress(new Headers({ "x-forwarded-for": "1".repeat(65) }))).toBe("unknown");
  });

  it("prefers a provider client header over a forwarded chain", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.8",
      "x-forwarded-for": "198.51.100.4",
    });
    expect(clientAddress(headers)).toBe("203.0.113.8");
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
