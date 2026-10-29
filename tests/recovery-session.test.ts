import { afterEach, describe, expect, it, vi } from "vitest";

const jar = vi.hoisted(() => ({ set: vi.fn(), get: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => jar }));

import { grantPasswordRecovery } from "@/lib/recovery-session";

const session = { sub: "member-one", session_id: "verified-recovery-session" };

describe("recovery signing key", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    jar.set.mockReset();
  });

  it("never falls back to the Supabase secret key", async () => {
    vi.stubEnv("RECOVERY_SIGNING_SECRET", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-supabase-key-only-not-a-real-credential");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key-only-not-a-real-credential");
    expect(await grantPasswordRecovery(session)).toBe(false);
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("grants recovery with a dedicated key", async () => {
    vi.stubEnv("RECOVERY_SIGNING_SECRET", "test-signing-key-only-not-a-real-credential");
    expect(await grantPasswordRecovery(session)).toBe(true);
    expect(jar.set).toHaveBeenCalledOnce();
  });
});
