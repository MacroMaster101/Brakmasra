import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn(), getClaims: vi.fn(), grant: vi.fn() }));
vi.mock("@/lib/features", () => ({ authEnabled: true, authDemoMode: false }));
vi.mock("@/lib/supabase-auth", () => ({ createAuthClient: async () => ({ auth: mocks }) }));
vi.mock("@/lib/recovery-session", () => ({ grantPasswordRecovery: mocks.grant }));
import { GET } from "@/app/auth/confirm/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.verifyOtp.mockResolvedValue({ error: null });
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "member", session_id: "recovery-session" } } });
  mocks.grant.mockResolvedValue(true);
});

describe("auth confirmation callback", () => {
  it("preserves a safe destination's query and fragment without leaking callback tokens", async () => {
    const response = await GET(new NextRequest("https://store.example/auth/confirm?code=test-code&next=%2Faccount%3Fwelcome%3D1%23profile"));
    expect(response.headers.get("location")).toBe("https://store.example/account?welcome=1#profile");
  });
  it("rejects external redirect destinations", async () => {
    const response = await GET(new NextRequest("https://store.example/auth/confirm?code=test-code&next=https://evil.example"));
    expect(response.headers.get("location")).toBe("https://store.example/account");
  });
  it("does not trust recovery flags attached to an OAuth callback", async () => {
    await GET(new NextRequest("https://store.example/auth/confirm?code=test-code&token_hash=fake&type=recovery"));
    expect(mocks.grant).not.toHaveBeenCalled();
  });
  it("grants recovery after a verified recovery token", async () => {
    await GET(new NextRequest("https://store.example/auth/confirm?token_hash=test-hash&type=recovery&next=/reset-password"));
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "test-hash", type: "recovery" });
    expect(mocks.grant).toHaveBeenCalledOnce();
  });
  it("handles provider outages with a clean failure redirect", async () => {
    mocks.exchangeCodeForSession.mockRejectedValue(new Error("private provider detail"));
    const response = await GET(new NextRequest("https://store.example/auth/confirm?code=test-code&next=/account?private=1"));
    expect(response.headers.get("location")).toBe("https://store.example/login?notice=confirmation-failed");
  });
});
