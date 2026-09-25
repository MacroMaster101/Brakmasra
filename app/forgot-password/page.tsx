import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { forgotPasswordAction, verifyResetCodeAction } from "@/app/auth/actions";
import { AuthComingSoon } from "@/components/coming-soon";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordFlow } from "@/components/forgot-password-flow";
import { Translated } from "@/components/translated";
import { authDemoMode, authEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  if (!authEnabled) return <AuthComingSoon />;
  if (authDemoMode) redirect("/account?demo=1");

  return (
    <AuthShell>
      <ForgotPasswordFlow requestAction={forgotPasswordAction} verifyAction={verifyResetCodeAction} />
      <p className="auth-switch"><Translated k="forgotRemembered" /> <Link href="/login"><Translated k="forgotReturn" /></Link></p>
    </AuthShell>
  );
}
