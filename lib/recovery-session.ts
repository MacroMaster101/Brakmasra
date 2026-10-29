import "server-only";
import { cookies } from "next/headers";
import {
  createRecoveryProof,
  isRecoveryProofValid,
  RECOVERY_TTL_SECONDS,
  type RecoverySession,
} from "@/lib/password-recovery";

const COOKIE = "brakmasra_recovery";
const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

// A dedicated key, never the Supabase secret: a database key must not double
// as a cookie-signing key. Unset or short, recovery fails closed.
function signingSecret() {
  return process.env.RECOVERY_SIGNING_SECRET;
}

export async function grantPasswordRecovery(session: RecoverySession) {
  const proof = createRecoveryProof(session, signingSecret());
  if (!proof) return false;
  (await cookies()).set(COOKIE, proof, { ...options, maxAge: RECOVERY_TTL_SECONDS });
  return true;
}

export async function hasPasswordRecovery(session: RecoverySession) {
  return isRecoveryProofValid((await cookies()).get(COOKIE)?.value, session, signingSecret());
}

export async function clearPasswordRecovery() {
  (await cookies()).set(COOKIE, "", { ...options, maxAge: 0 });
}
