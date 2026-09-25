import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { googleAuthAction, loginAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthComingSoon } from "@/components/coming-soon";
import { AuthShell } from "@/components/auth-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Translated } from "@/components/translated";
import { safeRedirectPath } from "@/lib/auth";
import { authDemoMode, authEnabled } from "@/lib/features";
import type { TextKey } from "@/lib/i18n";
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
  const noticeKeys: Record<string, TextKey | undefined> = {
    "confirmation-failed": "noticeConfirmationFailed",
    "google-rate-limited": "noticeGoogleLoginRateLimited",
    "google-unavailable": "noticeGoogleLoginUnavailable",
  };
  const noticeKey = signedOut
    ? "loginSignedOut"
    : Object.hasOwn(noticeKeys, notice) ? noticeKeys[notice] : undefined;

  return (
    <AuthShell titleKey="loginTitle" descriptionKey="loginDesc">
      {noticeKey && (
        <p className={`auth-page-notice${signedOut ? " is-success" : ""}`} role="status">
          <Translated k={noticeKey} />
        </p>
      )}
      <GoogleAuthButton action={googleAuthAction} next={next} returnTo="/login" />
      <AuthForm action={loginAction} mode="login" next={next} />
      <p className="auth-switch"><Translated k="loginNewHere" /> <Link href="/signup"><Translated k="loginCreateAccount" /></Link></p>
    </AuthShell>
  );
}
