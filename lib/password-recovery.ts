import { createHmac, timingSafeEqual } from "node:crypto";

export const RECOVERY_TTL_SECONDS = 15 * 60;
export type RecoverySession = { sub?: unknown; session_id?: unknown };

function validSession(session: RecoverySession) {
  return typeof session.sub === "string" && session.sub.length > 0
    && typeof session.session_id === "string" && session.session_id.length > 0;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update("brakmasra-password-recovery-v1\0")
    .update(payload)
    .digest("base64url");
}

/** Issued only after a recovery OTP succeeds, bound to that verified session. */
export function createRecoveryProof(session: RecoverySession, secret: string | undefined, now = Date.now()) {
  if (!secret || secret.length < 32 || !validSession(session)) return null;
  const payload = Buffer.from(JSON.stringify({
    sub: session.sub,
    sessionId: session.session_id,
    expires: Math.floor(now / 1000) + RECOVERY_TTL_SECONDS,
  })).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function isRecoveryProofValid(
  proof: string | undefined,
  session: RecoverySession,
  secret: string | undefined,
  now = Date.now(),
) {
  if (!proof || proof.length > 2048 || !secret || secret.length < 32 || !validSession(session)) return false;
  const parts = proof.split(".");
  if (parts.length !== 2) return false;
  const [payload, mac] = parts;
  const expected = Buffer.from(signature(payload, secret));
  const received = Buffer.from(mac);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return value.sub === session.sub && value.sessionId === session.session_id
      && Number.isSafeInteger(value.expires) && value.expires > Math.floor(now / 1000);
  } catch {
    return false;
  }
}
