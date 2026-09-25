import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { googleAuthAction, signupAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthComingSoon } from "@/components/coming-soon";
import { AuthShell } from "@/components/auth-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Translated } from "@/components/translated";
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
  const noticeKey = notice === "google-rate-limited"
    ? "noticeGoogleSignupRateLimited"
    : notice === "google-unavailable"
      ? "noticeGoogleSignupUnavailable"
      : null;

  return (
    <AuthShell compact titleKey="signupTitle" descriptionKey="signupDesc">
      {noticeKey && <p className="auth-page-notice" role="status"><Translated k={noticeKey} /></p>}
      <GoogleAuthButton action={googleAuthAction} next="/account?welcome=1" returnTo="/signup" />
      <AuthForm action={signupAction} mode="signup" />
      <p className="auth-legal">
        <Translated k="signupLegalPrefix" /> <Link href="/terms"><Translated k="legalTerms" /></Link>{" "}
        <Translated k="signupLegalAnd" /> <Link href="/privacy"><Translated k="legalPrivacy" /></Link>
        <Translated k="signupLegalSuffix" />
      </p>
      <p className="auth-switch"><Translated k="signupHaveAccount" /> <Link href="/login"><Translated k="signupSignIn" /></Link></p>
    </AuthShell>
  );
}
