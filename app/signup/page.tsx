import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { googleAuthAction, signupAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthComingSoon } from "@/components/coming-soon";
import { AuthShell } from "@/components/auth-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { authDemoMode, authEnabled } from "@/lib/features";
import { createAuthClient } from "@/lib/supabase-auth";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  if (!authEnabled) return <AuthComingSoon />;
  if (authDemoMode) redirect("/account?demo=1");

  const params = await searchParams;
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/account");

  const notice = typeof params.notice === "string" ? params.notice : "";
  const noticeMessage = notice === "google-rate-limited"
    ? "Too many Google sign-up attempts. Wait a few minutes and try again."
    : notice === "google-unavailable"
      ? "Google sign-up is unavailable right now. You can still use your email."
      : "";

  return (
    <AuthShell compact title="Create your account" description="Keep checkout details and future orders in one secure place.">
      {noticeMessage && <p className="auth-page-notice" role="status">{noticeMessage}</p>}
      <GoogleAuthButton action={googleAuthAction} next="/account?welcome=1" returnTo="/signup" />
      <AuthForm action={signupAction} mode="signup" />
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </AuthShell>
  );
}
