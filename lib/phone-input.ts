import { findPhoneCountry, normalizePhone } from "@/lib/phone";

export type PhoneInput = { phone: string; phone_country: string };

export type PhoneInputResult = { ok: true; value: PhoneInput | null } | { ok: false };

// Far longer than any real number; stops oversized payloads early.
const MAX_RAW_LENGTH = 32;

/**
 * Reads the optional country + number pair a form posted. A blank number means
 * no phone was given; anything else must be a plausible number for a listed
 * country. Values are untrusted FormData entries, so anything may arrive.
 */
export function parsePhoneInput(country: unknown, number: unknown): PhoneInputResult {
  if (number === null || number === undefined) return { ok: true, value: null };
  if (typeof number !== "string") return { ok: false };

  const raw = number.trim();
  if (!raw) return { ok: true, value: null };
  if (raw.length > MAX_RAW_LENGTH) return { ok: false };
  if (typeof country !== "string" || !findPhoneCountry(country)) return { ok: false };

  const phone = normalizePhone(country, raw);
  return phone ? { ok: true, value: { phone, phone_country: country } } : { ok: false };
}
