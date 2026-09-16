import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { notFound } from "next/navigation";

import { isStaffRole } from "@/lib/auth";
import { authDemoMode, authEnabled } from "@/lib/features";
import { createAuthClient } from "@/lib/supabase-auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Deliberately minimal: an unauthenticated visitor learns only that the area is
// restricted. No configuration state or system map
// is disclosed here.
export default async function AdminPage() {
  if (!authEnabled || authDemoMode) notFound();

  let role: unknown;
  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.getClaims();
    if (!error) role = data?.claims?.app_metadata?.role;
  } catch {
    // Authorization fails closed if authentication is unavailable.
  }

  if (!isStaffRole(role)) notFound();

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <span className="eyebrow">Restricted</span>
        <h1>Admin</h1>
        <div className="notice">
          <KeyRound />
          <div>
            <h2>Sign-in required</h2>
            <p>This area is restricted to BRAKMASRA staff.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
