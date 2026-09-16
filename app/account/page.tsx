import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, PackageOpen, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/auth/actions";
import { StoreComingSoon } from "@/components/coming-soon";
import { authDemoMode, authEnabled } from "@/lib/features";
import { createAuthClient } from "@/lib/supabase-auth";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

type AccountPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  if (!authEnabled) return <StoreComingSoon area="account" />;

  const params = await searchParams;
  const noticeMessage = authDemoMode
    ? "Local demo session. No Supabase user or cookie was created."
    : params.password === "updated"
      ? "Your password has been updated."
      : "Your account is ready.";
  let displayName = "Preview member";
  let email = "preview@brakmasra.local";
  let joined = "Local preview";

  if (!authDemoMode) {
    const supabase = await createAuthClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData?.claims) redirect("/login?next=/account");

    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) redirect("/login?next=/account");

    const user = userData.user;
    displayName = typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : "BRAKMASRA member";
    email = user.email || "";
    joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(user.created_at));
  }

  return (
    <section className="account-page">
      <div className="page-shell account-shell">
        <header className="account-header">
          <div>
            <span className="eyebrow">Your account</span>
            <h1>{displayName}</h1>
            <p>{email}</p>
          </div>
          <form action={logoutAction}>
            <button className="button button-secondary" type="submit"><LogOut />{authDemoMode ? "Exit preview" : "Sign out"}</button>
          </form>
        </header>

        {(authDemoMode || params.welcome === "1" || params.password === "updated") && (
          <p className="account-notice" role="status">
            {noticeMessage}
          </p>
        )}

        <div className="account-grid">
          <article className="account-profile">
            <ShieldCheck />
            <div>
              <h2>Account details</h2>
              <dl>
                <div><dt>Name</dt><dd>{displayName}</dd></div>
                <div><dt>Email</dt><dd>{email}</dd></div>
                <div><dt>Member since</dt><dd>{joined}</dd></div>
              </dl>
            </div>
          </article>

          <article className="account-orders">
            <PackageOpen />
            <h2>No orders yet</h2>
            <p>Your confirmed orders will appear here after checkout is enabled.</p>
            <Link className="button button-primary" href="/shop">Explore the collection</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
