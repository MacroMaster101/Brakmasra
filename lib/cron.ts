import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when that variable
 * is set. Without a configured secret of reasonable length, every request is
 * refused, so the job endpoint can never be triggered anonymously.
 */
export function isAuthorizedCronRequest(authorization: string | null, secret: string | undefined) {
  if (!secret || secret.length < 16 || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
