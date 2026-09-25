"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthWeakPasswordError } from "@supabase/supabase-js";
import { z } from "zod";

import { getAuthCallbackUrl, safeRedirectPath } from "@/lib/auth";
import { isServiceOutage, isSupabaseUnreachable } from "@/lib/auth-errors";
import { authDemoMode, authEnabled } from "@/lib/features";
import { parsePhoneInput } from "@/lib/phone-input";
import { rateLimit } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request";
import { RESET_CODE_LENGTH } from "@/lib/reset-code";
import { createAuthClient } from "@/lib/supabase-auth";

export type AuthActionState = {
  message: string;
  status: "idle" | "error" | "success";
  /** Password reset: the address the code was requested for. */
  email?: string;
  /** Password reset: changes on every successful send, restarting the resend countdown. */
  sentAt?: number;
};

const emailSchema = z.string().trim().email("Enter a valid email address.").max(254);
const resetCodeSchema = z.object({
  email: emailSchema,
  token: z.string().trim().regex(new RegExp(`^[0-9]{${RESET_CODE_LENGTH}}$`), "Enter the 6-digit code from the email."),
});
const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer.");
// New passwords must also meet Supabase's "lowercase, uppercase, digits and
// symbols" rule; sign-in stays on the basic check so older passwords still work.
const newPasswordSchema = passwordSchema
  .regex(/[a-z]/, "Use upper and lowercase letters, a number, and a symbol.")
  .regex(/[A-Z]/, "Use upper and lowercase letters, a number, and a symbol.")
  .regex(/[0-9]/, "Use upper and lowercase letters, a number, and a symbol.")
  .regex(/[^A-Za-z0-9]/, "Use upper and lowercase letters, a number, and a symbol.");

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Optional at signup: a blank number stores nothing, anything else must be valid.
const optionalPhoneSchema = z.object({ country: z.unknown(), number: z.unknown() }).transform((input, ctx) => {
  const result = parsePhoneInput(input.country, input.number);
  if (result.ok) return result.value;
  ctx.addIssue({ code: "custom", message: "Enter a valid mobile number for the selected country." });
  return z.NEVER;
});

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name.").max(80),
  email: emailSchema,
  phone: optionalPhoneSchema,
  password: newPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  password: newPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function firstIssue(result: { error: { issues: { message: string }[] } }) {
  return result.error.issues[0]?.message || "Check the form and try again.";
}

async function authRateLimit(scope: string, limit: number, windowMs: number, subject?: string) {
  const requestHeaders = await headers();
  const subjectKey = subject
    ? createHash("sha256").update(subject.trim().toLowerCase()).digest("hex").slice(0, 24)
    : "request";
  return rateLimit(`auth:${scope}:${clientAddress(requestHeaders)}:${subjectKey}`, limit, windowMs);
}

function googleFailureUrl(returnTo: string, notice: string, next: string) {
  const destination = returnTo === "/signup" ? "/signup" : "/login";
  const params = new URLSearchParams({ notice });
  if (next !== "/account") params.set("next", next);
  return `${destination}?${params.toString()}`;
}

export async function googleAuthAction(formData: FormData) {
  if (!authEnabled) redirect("/login");

  const next = safeRedirectPath(formData.get("next"));
  if (authDemoMode) redirect(next);

  const returnTo = formData.get("returnTo") === "/signup" ? "/signup" : "/login";
  const attempt = await authRateLimit("google", 12, 15 * 60_000);

  if (!attempt.allowed) {
    redirect(googleFailureUrl(returnTo, "google-rate-limited", next));
  }

  let providerUrl: string | null = null;

  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(next),
      },
    });

    if (!error && data.url) providerUrl = data.url;
  } catch {
    // Provider errors are reported through the generic failure redirect below.
  }

  if (!providerUrl) {
    redirect(googleFailureUrl(returnTo, "google-unavailable", next));
  }

  redirect(providerUrl);
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!authEnabled) return { status: "error", message: "Member access is coming soon." };
  if (authDemoMode) redirect(safeRedirectPath(formData.get("next")));

  const attempt = await authRateLimit("login", 10, 15 * 60_000);
  if (!attempt.allowed) {
    return { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  const accountAttempt = await authRateLimit("login-account", 8, 15 * 60_000, parsed.data.email);
  if (!accountAttempt.allowed) {
    return { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
  }

  try {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error && isServiceOutage(error)) {
      return { status: "error", message: "Sign in is unavailable right now. Please try again." };
    }
    if (error) return { status: "error", message: "Email or password is incorrect." };
  } catch {
    return { status: "error", message: "Sign in is unavailable right now. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("next")));
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!authEnabled) return { status: "error", message: "Member access is coming soon." };
  if (authDemoMode) redirect("/account?demo=1");

  const attempt = await authRateLimit("signup", 5, 60 * 60_000);
  if (!attempt.allowed) {
    return { status: "error", message: "Too many attempts. Wait before creating another account." };
  }

  const parsed = signupSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: { country: formData.get("phoneCountry"), number: formData.get("phone") },
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  const accountAttempt = await authRateLimit("signup-account", 3, 60 * 60_000, parsed.data.email);
  if (!accountAttempt.allowed) {
    return { status: "error", message: "Account creation is unavailable right now. Please try again later." };
  }

  let signedIn = false;
  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName, ...parsed.data.phone },
        emailRedirectTo: getAuthCallbackUrl("/account"),
      },
    });

    if (error && isSupabaseUnreachable(error)) {
      return { status: "error", message: "Account creation is unavailable right now. Please try again." };
    }
    // Password strength is checked before the account lookup, so this reveals nothing.
    if (isAuthWeakPasswordError(error)) return { status: "error", message: "Use upper and lowercase letters, a number, and a symbol." };
    if (error) {
      return {
        status: "success",
        message: "If this address can be registered, check your inbox to finish creating your account.",
      };
    }
    signedIn = Boolean(data.session);
  } catch {
    return { status: "error", message: "Account creation is unavailable right now. Please try again." };
  }

  if (signedIn) {
    revalidatePath("/", "layout");
    redirect("/account?welcome=1");
  }

  return {
    status: "success",
    message: "Check your inbox and confirm your email to finish creating your account.",
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!authEnabled) return { status: "error", message: "Member access is coming soon." };
  if (authDemoMode) return { status: "success", message: "Demo mode is using a local fake session." };

  const attempt = await authRateLimit("forgot", 5, 60 * 60_000);
  if (!attempt.allowed) {
    return { status: "error", message: "Too many requests. Wait before trying again." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  try {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: getAuthCallbackUrl("/reset-password"),
    });
    // Only an unreachable service is reported; any answer from Supabase gets
    // the generic reply below so the response never reveals an account.
    if (error && isSupabaseUnreachable(error)) {
      return { status: "error", message: "Password reset is unavailable right now. Please try again." };
    }
  } catch {
    // Keep the response identical whether an account exists or not.
  }

  // Same reply whether or not the account exists; the code step always opens.
  return {
    status: "success",
    message: "If an account exists for that email, a 6-digit code is on its way.",
    email: parsed.data,
    sentAt: Date.now(),
  };
}

export async function verifyResetCodeAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!authEnabled) return { status: "error", message: "Member access is coming soon." };
  if (authDemoMode) redirect("/account?demo=1");

  const attempt = await authRateLimit("reset-verify", 20, 15 * 60_000);
  if (!attempt.allowed) {
    return { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
  }

  const parsed = resetCodeSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  // A handful of guesses per address, well short of what a 6-digit code needs.
  const accountAttempt = await authRateLimit("reset-verify-account", 5, 15 * 60_000, parsed.data.email);
  if (!accountAttempt.allowed) {
    return { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
  }

  try {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: "recovery",
    });
    if (error && isSupabaseUnreachable(error)) {
      return { status: "error", message: "Password reset is unavailable right now. Please try again." };
    }
    if (error) return { status: "error", message: "That code is incorrect or has expired." };
  } catch {
    return { status: "error", message: "Password reset is unavailable right now. Please try again." };
  }

  // The verified code signs the member in; the reset page sets the new password.
  revalidatePath("/", "layout");
  redirect("/reset-password");
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!authEnabled) return { status: "error", message: "Member access is coming soon." };
  if (authDemoMode) redirect("/account?demo=1");

  const attempt = await authRateLimit("reset", 6, 15 * 60_000);
  if (!attempt.allowed) {
    return { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
  }

  const parsed = resetSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  try {
    const supabase = await createAuthClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) return { status: "error", message: "Request a new reset code and try again." };

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (isAuthWeakPasswordError(error)) return { status: "error", message: "Use upper and lowercase letters, a number, and a symbol." };
    if (error?.code === "same_password") {
      return { status: "error", message: "Choose a password you haven't used for this account." };
    }
    if (error) return { status: "error", message: "Your password could not be updated. Request a new reset code and try again." };
  } catch {
    return { status: "error", message: "Your password could not be updated. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/account?password=updated");
}

export async function logoutAction() {
  if (!authEnabled) redirect("/login");
  if (authDemoMode) redirect("/");

  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?signedOut=1");
}
