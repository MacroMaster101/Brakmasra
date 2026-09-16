import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { forgotPasswordAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthComingSoon } from "@/components/coming-soon";
import { AuthShell } from "@/components/auth-shell";
import { authDemoMode, authEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  if (!authEnabled) return <AuthComingSoon />;
  if (authDemoMode) redirect("/account?demo=1");

  return (
    <AuthShell title="Reset your password" description="Enter your email and we will send a secure reset link.">
      <AuthForm action={forgotPasswordAction} mode="forgot" />
      <p className="auth-switch">Remembered it? <Link href="/login">Return to sign in</Link></p>
    </AuthShell>
  );
}
