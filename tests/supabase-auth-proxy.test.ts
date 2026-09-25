import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { hasSupabaseAuthCookie } from "@/lib/supabase-auth-proxy";

function requestWithCookie(cookie?: string) {
  return new NextRequest("http://localhost:3000/shop", { headers: cookie ? { cookie } : {} });
}

describe("hasSupabaseAuthCookie", () => {
  it("is false for anonymous visitors so they never trigger a Supabase call", () => {
    expect(hasSupabaseAuthCookie(requestWithCookie())).toBe(false);
    expect(hasSupabaseAuthCookie(requestWithCookie("brakmasra-lang=si; theme=dark"))).toBe(false);
  });

  it("detects whole and chunked Supabase session cookies", () => {
    expect(hasSupabaseAuthCookie(requestWithCookie("sb-abcd-auth-token=base64-xyz"))).toBe(true);
    expect(hasSupabaseAuthCookie(requestWithCookie("brakmasra-lang=en; sb-abcd-auth-token.0=part"))).toBe(true);
  });

  it("ignores cookies that only resemble the session cookie", () => {
    expect(hasSupabaseAuthCookie(requestWithCookie("my-sb-abcd-auth-token=1; sb-abcd-preferences=2"))).toBe(false);
  });
});
