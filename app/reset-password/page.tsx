import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resetPasswordAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthComingSoon } from "@/components/coming-soon";
import { AuthShell } from "@/components/auth-shell";
import { authDemoMode, authEnabled } from "@/lib/features";
import { createAuthClient } from "@/lib/supabase-auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage() {
  if (!authEnabled) return <AuthComingSoon />;
  if (authDemoMode) redirect("/account?demo=1");

  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/forgot-password");

  return (
    <AuthShell title="Choose a new password" description="Use at least eight characters that you have not used here before.">
      <AuthForm action={resetPasswordAction} mode="reset" />
    </AuthShell>
  );
}
