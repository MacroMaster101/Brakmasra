import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(), verifyOtp: vi.fn(), updateUser: vi.fn(),
  grant: vi.fn(), has: vi.fn(), clear: vi.fn(),
}));
vi.mock("@/lib/features", () => ({ authEnabled: true, authDemoMode: false }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => ({ allowed: true }) }));
vi.mock("@/lib/supabase-auth", () => ({ createAuthClient: async () => ({ auth: mocks }) }));
vi.mock("@/lib/recovery-session", () => ({
  grantPasswordRecovery: mocks.grant, hasPasswordRecovery: mocks.has, clearPasswordRecovery: mocks.clear,
}));

import { resetPasswordAction, verifyResetCodeAction } from "@/app/auth/actions";

const idle = { status: "idle" as const, message: "" };
const claims = { sub: "member-one", session_id: "session-one" };
function passwordForm() {
  const form = new FormData();
  form.set("password", "StrongTestPassword!234");
  form.set("confirmPassword", "StrongTestPassword!234");
  return form;
}
function codeForm() {
  const form = new FormData();
  form.set("email", "member@example.com");
  form.set("token", "123456");
  return form;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getClaims.mockResolvedValue({ data: { claims } });
  mocks.verifyOtp.mockResolvedValue({ error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.grant.mockResolvedValue(true);
  mocks.has.mockResolvedValue(false);
});

describe("recovery action authorization", () => {
  it("refuses a normal signed-in session without recovery proof", async () => {
    expect((await resetPasswordAction(idle, passwordForm())).status).toBe("error");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("updates only with recovery proof and clears it after success", async () => {
    mocks.has.mockResolvedValue(true);
    await expect(resetPasswordAction(idle, passwordForm())).rejects.toThrow("REDIRECT:/account?password=updated");
    expect(mocks.has).toHaveBeenCalledWith(claims);
    expect(mocks.updateUser).toHaveBeenCalledOnce();
    expect(mocks.clear).toHaveBeenCalledOnce();
  });
  it("grants recovery only after verifying a recovery OTP and session", async () => {
    await expect(verifyResetCodeAction(idle, codeForm())).rejects.toThrow("REDIRECT:/reset-password");
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ email: "member@example.com", token: "123456", type: "recovery" });
    expect(mocks.grant).toHaveBeenCalledWith(claims);
  });
  it("does not grant recovery for incorrect codes or missing claims", async () => {
    mocks.verifyOtp.mockResolvedValueOnce({ error: { message: "expired", status: 400 } });
    expect((await verifyResetCodeAction(idle, codeForm())).status).toBe("error");
    expect(mocks.grant).not.toHaveBeenCalled();
    mocks.getClaims.mockResolvedValueOnce({ data: { claims: null } });
    expect((await verifyResetCodeAction(idle, codeForm())).status).toBe("error");
    expect(mocks.grant).not.toHaveBeenCalled();
  });
});
