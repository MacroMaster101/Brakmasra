"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAuthCallbackUrl, safeRedirectPath } from "@/lib/auth";
import { authDemoMode, authEnabled } from "@/lib/features";
import { rateLimit } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request";
import { createAuthClient } from "@/lib/supabase-auth";

export type AuthActionState = {
  message: string;
  status: "idle" | "error" | "success";
};

const emailSchema = z.string().trim().email("Enter a valid email address.").max(254);
const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer.");

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name.").max(80),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  password: passwordSchema,
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
  } catch {}

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
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: getAuthCallbackUrl("/account"),
      },
    });

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
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: getAuthCallbackUrl("/reset-password"),
    });
  } catch {
    // Keep the response identical whether an account exists or not.
  }

  return {
    status: "success",
    message: "If an account exists for that email, a reset link is on its way.",
  };
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
    if (!data?.claims) return { status: "error", message: "Open a fresh password reset link and try again." };

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { status: "error", message: "Your password could not be updated. Open a fresh reset link and try again." };
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
