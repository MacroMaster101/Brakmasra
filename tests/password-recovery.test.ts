import { describe, expect, it } from "vitest";
import { createRecoveryProof, isRecoveryProofValid, RECOVERY_TTL_SECONDS } from "@/lib/password-recovery";

const secret = "test-signing-key-only-not-a-real-credential";
const session = { sub: "member-one", session_id: "verified-recovery-session" };
const now = 1_800_000_000_000;

describe("password recovery proof", () => {
  it("accepts a signed grant only for the verified member and session", () => {
    const proof = createRecoveryProof(session, secret, now)!;
    expect(isRecoveryProofValid(proof, session, secret, now)).toBe(true);
    expect(isRecoveryProofValid(proof, { ...session, sub: "another-member" }, secret, now)).toBe(false);
    expect(isRecoveryProofValid(proof, { ...session, session_id: "normal-login" }, secret, now)).toBe(false);
  });

  it("rejects missing grants, missing keys, and incomplete sessions", () => {
    expect(isRecoveryProofValid(undefined, session, secret, now)).toBe(false);
    expect(createRecoveryProof(session, undefined, now)).toBeNull();
    expect(createRecoveryProof(session, "short", now)).toBeNull();
    expect(createRecoveryProof({ sub: "member-one" }, secret, now)).toBeNull();
  });

  it("rejects expired, forged, and malformed grants", () => {
    const proof = createRecoveryProof(session, secret, now)!;
    expect(isRecoveryProofValid(proof, session, secret, now + RECOVERY_TTL_SECONDS * 1000)).toBe(false);
    const [payload, mac] = proof.split(".");
    const edited = Buffer.from(JSON.stringify({ sub: session.sub, sessionId: session.session_id, expires: 9_999_999_999 })).toString("base64url");
    expect(isRecoveryProofValid(`${edited}.${mac}`, session, secret, now)).toBe(false);
    expect(isRecoveryProofValid(`${payload}.invalid`, session, secret, now)).toBe(false);
    expect(isRecoveryProofValid(proof, session, "different-key-with-more-than-thirty-two-characters", now)).toBe(false);
    expect(isRecoveryProofValid("x".repeat(3000), session, secret, now)).toBe(false);
    expect(isRecoveryProofValid("malformed", session, secret, now)).toBe(false);
  });
});
