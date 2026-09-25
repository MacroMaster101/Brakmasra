"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, isAuthWeakPasswordError, type User } from "@supabase/supabase-js";

import { getAuthCallbackUrl, getAuthEnvironment } from "@/lib/auth";
import {
  changeEmailSchema,
  firstIssue,
  formText,
  isInvalidNonce,
  needsReauthentication,
  parseProfile,
  passwordUpdateSchema,
  sameEmail,
} from "@/lib/account-validation";
import { isServiceOutage, isSupabaseUnreachable } from "@/lib/auth-errors";
import { authDemoMode, authEnabled } from "@/lib/features";
import { memberFromUser } from "@/lib/member";
import { rateLimit } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request";
import { createAuthClient } from "@/lib/supabase-auth";

export type AccountActionState = {
  status: "idle" | "error" | "success" | "reauth";
  message: string;
  /** Password form: keep the code step open after a wrong or expired code. */
  codeRequired?: boolean;
};

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const closed: AccountActionState = { status: "error", message: "Member access is coming soon." };
const demoSaved: AccountActionState = { status: "success", message: "Preview mode. Changes are not saved." };
const tooManyAttempts: AccountActionState = { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
const signInAgain: AccountActionState = { status: "error", message: "Sign in again to continue." };

async function accountRateLimit(scope: string, limit: number, windowMs: number, subject?: string) {
  const requestHeaders = await headers();
  const subjectKey = subject
    ? createHash("sha256").update(subject.trim().toLowerCase()).digest("hex").slice(0, 24)
    : "request";
  return rateLimit(`account:${scope}:${clientAddress(requestHeaders)}:${subjectKey}`, limit, windowMs);
}

/** The member from the cookie session. Ids and emails are never read from the form. */
async function sessionUser(): Promise<{ supabase: AuthClient; user: User } | null> {
  const supabase = await createAuthClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

export async function updateProfileAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  if (!authEnabled) return closed;
  if (authDemoMode) return demoSaved;

  const attempt = await accountRateLimit("profile", 20, 15 * 60_000);
  if (!attempt.allowed) return tooManyAttempts;

  const parsed = parseProfile({
    displayName: formText(formData.get("displayName")),
    phoneCountry: formData.get("phoneCountry"),
    phone: formData.get("phone"),
  });
  if (!parsed.ok) return { status: "error", message: parsed.message };

  try {
    const session = await sessionUser();
    if (!session) return signInAgain;

    const { error } = await session.supabase.auth.updateUser({
      data: {
        display_name: parsed.data.displayName,
        phone: parsed.data.phone,
        phone_country: parsed.data.phoneCountry,
      },
    });
    if (error) return { status: "error", message: "Your profile could not be saved. Please try again." };
  } catch {
    return { status: "error", message: "Your profile could not be saved. Please try again." };
  }

  // The header shows the name and initials, so refresh every layout.
  revalidatePath("/", "layout");
  return { status: "success", message: "Your profile has been saved." };
}

export async function changeEmailAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  if (!authEnabled) return closed;
  if (authDemoMode) return demoSaved;

  const attempt = await accountRateLimit("email", 6, 60 * 60_000);
  if (!attempt.allowed) return { status: "error", message: "Too many requests. Wait before trying again." };

  const parsed = changeEmailSchema.safeParse({ email: formText(formData.get("email")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  try {
    const session = await sessionUser();
    if (!session) return signInAgain;
    if (sameEmail(parsed.data.email, session.user.email ?? "")) {
      return { status: "error", message: "That is already your email address." };
    }

    // Each change sends two emails, so the account gets its own small budget.
    const accountAttempt = await accountRateLimit("email-account", 3, 60 * 60_000, session.user.id);
    if (!accountAttempt.allowed) return { status: "error", message: "Too many requests. Wait before trying again." };

    const { error } = await session.supabase.auth.updateUser(
      { email: parsed.data.email },
      { emailRedirectTo: getAuthCallbackUrl("/account/settings") },
    );
    // Only an unreachable service is reported. Any answer from Supabase, such
    // as "address already registered", gets the generic reply below so the
    // form never reveals whether another account uses the new address.
    if (error && isSupabaseUnreachable(error)) {
      return { status: "error", message: "Email change is unavailable right now. Please try again." };
    }
  } catch {
    return { status: "error", message: "Email change is unavailable right now. Please try again." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Check both your current and new inbox to confirm the change." };
}

/** Checks the current password on a throwaway client so the member's cookie session is untouched. */
async function verifyCurrentPassword(email: string, password: string): Promise<"ok" | "wrong" | "outage"> {
  const { publishableKey, url } = getAuthEnvironment();
  const verifier = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await verifier.auth.signInWithPassword({ email, password });
  if (error) return isServiceOutage(error) ? "outage" : "wrong";

  if (data.session) {
    try {
      // Revokes only the session this check created.
      await verifier.auth.signOut({ scope: "local" });
    } catch {
      // The throwaway session expires on its own; the check itself succeeded.
    }
  }
  return "ok";
}

export async function updatePasswordAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  if (!authEnabled) return closed;
  if (authDemoMode) return demoSaved;

  const attempt = await accountRateLimit("password", 12, 15 * 60_000);
  if (!attempt.allowed) return tooManyAttempts;

  // "Send a new code" resubmits the form without the code, which makes
  // Supabase ask for reauthentication again and email a fresh one.
  const resend = formData.get("resend") === "1";
  const parsed = passwordUpdateSchema.safeParse({
    password: formText(formData.get("password")),
    confirmPassword: formText(formData.get("confirmPassword")),
    currentPassword: formText(formData.get("currentPassword")),
    nonce: resend ? "" : formText(formData.get("nonce")),
  });
  if (!parsed.success) {
    const codeRequired = parsed.error.issues.some((issue) => issue.path[0] === "nonce");
    return { status: "error", message: firstIssue(parsed), codeRequired };
  }
  const { currentPassword, nonce, password } = parsed.data;

  try {
    const session = await sessionUser();
    if (!session) return signInAgain;
    const { supabase, user } = session;
    // Decided from the verified session, never from a flag in the form.
    const member = memberFromUser(user);

    if (member.hasPassword) {
      if (!currentPassword) return { status: "error", message: "Enter your current password.", codeRequired: Boolean(nonce) };

      const accountAttempt = await accountRateLimit("password-verify", 8, 15 * 60_000, user.id);
      if (!accountAttempt.allowed) return tooManyAttempts;

      const check = await verifyCurrentPassword(member.email, currentPassword);
      if (check === "outage") return { status: "error", message: "Password change is unavailable right now. Please try again." };
      if (check === "wrong") return { status: "error", message: "Your current password is incorrect." };
    }

    const { error } = await supabase.auth.updateUser({
      password,
      ...(nonce ? { nonce } : {}),
      ...(member.hasPassword ? {} : { data: { password_set: true } }),
    });

    if (error && isServiceOutage(error)) {
      return { status: "error", message: "Password change is unavailable right now. Please try again." };
    }
    if (error && nonce && (isInvalidNonce(error) || needsReauthentication(error))) {
      return { status: "error", message: "That code is incorrect or has expired.", codeRequired: true };
    }
    if (error && needsReauthentication(error)) {
      const sendAttempt = await accountRateLimit("password-reauth", 5, 60 * 60_000, user.id);
      if (!sendAttempt.allowed) return { status: "error", message: "Too many requests. Wait before trying again." };

      const { error: sendError } = await supabase.auth.reauthenticate();
      if (sendError?.status === 429) return { status: "error", message: "Too many requests. Wait before trying again." };
      if (sendError) return { status: "error", message: "Password change is unavailable right now. Please try again." };
      return { status: "reauth", message: "We emailed you a 6-digit code to confirm it's you." };
    }
    if (isAuthWeakPasswordError(error)) {
      return { status: "error", message: "Use upper and lowercase letters, a number, and a symbol." };
    }
    if (error?.code === "same_password") {
      return { status: "error", message: "Choose a password you haven't used for this account." };
    }
    if (error) return { status: "error", message: "Your password could not be updated. Please try again." };

    revalidatePath("/", "layout");
    return member.hasPassword
      ? { status: "success", message: "Your password has been updated." }
      : { status: "success", message: "Password set. You can now also sign in with your email." };
  } catch {
    return { status: "error", message: "Password change is unavailable right now. Please try again." };
  }
}
