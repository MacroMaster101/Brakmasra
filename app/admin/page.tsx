import type { Metadata } from "next";
import { KeyRound } from "lucide-react";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// Deliberately minimal: an unauthenticated visitor learns only that the area is
// restricted. No configuration state or system map
// is disclosed here.
export default function AdminPage() {
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
