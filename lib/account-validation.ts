import { z } from "zod";

import { parsePhoneInput } from "@/lib/phone-input";
import { RESET_CODE_LENGTH } from "@/lib/reset-code";

// Pure validation for the member account forms, shared by the server actions
// and the tests. The wording matches app/auth/actions.ts so the existing
// Sinhala translations apply.

export const PHONE_INVALID_MESSAGE = "Enter a valid mobile number for the selected country.";

const PASSWORD_RULES_MESSAGE = "Use upper and lowercase letters, a number, and a symbol.";

const newPasswordSchema = z.string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[a-z]/, PASSWORD_RULES_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_RULES_MESSAGE)
  .regex(/[0-9]/, PASSWORD_RULES_MESSAGE)
  .regex(/[^A-Za-z0-9]/, PASSWORD_RULES_MESSAGE);

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name.").max(80, "Use 80 characters or fewer for your name."),
});

export const changeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254, "Enter a valid email address."),
});

export const passwordUpdateSchema = z.object({
  password: newPasswordSchema,
  confirmPassword: z.string(),
  // Only checked for members who already have a password; see the action.
  currentPassword: z.string().max(72, "Use 72 characters or fewer."),
  // Empty until Supabase asks for reauthentication and the member enters the code.
  nonce: z.string().trim().regex(new RegExp(`^([0-9]{${RESET_CODE_LENGTH}})?$`), "Enter the 6-digit code from the email."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

/** Missing form fields arrive as null; the schemas expect strings. */
export function formText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function firstIssue(result: { error: { issues: { message: string }[] } }) {
  return result.error.issues[0]?.message || "Check the form and try again.";
}

export type ProfileUpdate = { displayName: string; phone: string | null; phoneCountry: string | null };

/**
 * Validates the profile form. A blank number clears the stored phone; any
 * other value must be a plausible number for the chosen country.
 */
export function parseProfile(input: { displayName: string; phoneCountry: unknown; phone: unknown }):
  { ok: true; data: ProfileUpdate } | { ok: false; message: string } {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed) };

  // Same rules as sign-up: blank clears it, anything else must fit the country.
  const phone = parsePhoneInput(input.phoneCountry, input.phone);
  if (!phone.ok) return { ok: false, message: PHONE_INVALID_MESSAGE };
  return {
    ok: true,
    data: {
      displayName: parsed.data.displayName,
      phone: phone.value?.phone ?? null,
      phoneCountry: phone.value?.phone_country ?? null,
    },
  };
}

export function sameEmail(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

type AuthErrorLike = { code?: string; message?: string } | null | undefined;

/** Supabase wants a fresh sign-in (or an emailed nonce) before a password change. */
export function needsReauthentication(error: AuthErrorLike) {
  if (!error) return false;
  if (error.code === "reauthentication_needed") return true;
  if (error.code === "reauthentication_not_valid") return false;
  return /reauthentication/i.test(error.message ?? "") && !/invalid|not valid|expired/i.test(error.message ?? "");
}

/** The emailed nonce was wrong, expired, or already used. */
export function isInvalidNonce(error: AuthErrorLike) {
  if (!error) return false;
  if (error.code === "reauthentication_not_valid") return true;
  return /nonce/i.test(error.message ?? "");
}
