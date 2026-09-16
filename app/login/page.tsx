import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { googleAuthAction, loginAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthComingSoon } from "@/components/coming-soon";
import { AuthShell } from "@/components/auth-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { safeRedirectPath } from "@/lib/auth";
import { authDemoMode, authEnabled } from "@/lib/features";
import { createAuthClient } from "@/lib/supabase-auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!authEnabled) return <AuthComingSoon />;

  const params = await searchParams;
  const next = safeRedirectPath(typeof params.next === "string" ? params.next : null);
  if (authDemoMode) redirect(next);

  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect(next);

  const notice = typeof params.notice === "string" ? params.notice : "";
  const signedOut = params.signedOut === "1";
  const noticeMessage = {
    "confirmation-failed": "That confirmation link is invalid or has expired.",
    "google-rate-limited": "Too many Google sign-in attempts. Wait a few minutes and try again.",
    "google-unavailable": "Google sign-in is unavailable right now. You can still use your email.",
  }[notice];

  return (
    <AuthShell title="Welcome back" description="Sign in to manage your account and order details.">
      {(noticeMessage || signedOut) && (
        <p className={`auth-page-notice${signedOut ? " is-success" : ""}`} role="status">
          {signedOut ? "You have been signed out." : noticeMessage}
        </p>
      )}
      <GoogleAuthButton action={googleAuthAction} next={next} returnTo="/login" />
      <AuthForm action={loginAction} mode="login" next={next} />
      <p className="auth-switch">New here? <Link href="/signup">Create an account</Link></p>
    </AuthShell>
  );
}
