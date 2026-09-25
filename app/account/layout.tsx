import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAccountMember } from "@/app/account/current-member";
import { logoutAction } from "@/app/auth/actions";
import { AccountHeader } from "@/components/account/account-header";
import { AccountTabs } from "@/components/account/account-tabs";
import { StoreComingSoon } from "@/components/coming-soon";
import { ControlRoomLink } from "@/components/control-room/control-room-link";
import { RoleBadge } from "@/components/role-badge";
import { authDemoMode, authEnabled } from "@/lib/features";
import { can } from "@/lib/roles";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!authEnabled) return <StoreComingSoon area="account" />;

  const member = await getAccountMember();
  if (!member) redirect("/login?next=/account");

  return (
    <section className="account-page">
      <div className="page-shell account-shell">
        <AccountHeader
          member={{
            name: member.name,
            email: member.email,
            initials: member.initials,
            createdAt: member.createdAt,
            avatarUrl: member.avatarUrl,
          }}
          demo={authDemoMode}
          logoutAction={logoutAction}
          actions={can(member.role, "control_room") ? <ControlRoomLink /> : null}
        >
          <RoleBadge role={member.role} />
        </AccountHeader>
        <AccountTabs />
        <div className="account-content">{children}</div>
      </div>
    </section>
  );
}
