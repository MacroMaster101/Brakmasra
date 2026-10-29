import type { Metadata } from "next";

import { noIndex, requireControlRoom } from "@/app/admin/access";
import { DashboardShell } from "@/components/control-room/dashboard-shell";
import { countNewMessages } from "@/lib/control-room";
import { can } from "@/lib/roles";
import { DashboardToolbar } from "@/components/control-room/dashboard-toolbar";
import { DashboardNotifications } from "@/components/control-room/notifications";
import { ControlRoomHeader } from "@/components/control-room/control-room-header";
import { DashboardContent } from "@/components/control-room/dashboard-content";
import { controlRoomSections } from "@/lib/control-room-validation";

export const metadata: Metadata = { title: "Control Room", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomLayout({ children, modal }: { children: React.ReactNode; modal?: React.ReactNode }) {
  // Each page checks again: layouts don't re-run on every client navigation.
  const viewer = await requireControlRoom("control_room", "/admin");

  const unread = can(viewer.role, "view_messages") ? await countNewMessages() : undefined;
  const member = { name: viewer.name, email: viewer.email, initials: viewer.initials, role: viewer.role, avatarUrl: viewer.avatarUrl };

  return (
    <DashboardNotifications>
    <DashboardShell>
      <DashboardToolbar member={member} unread={unread} />
      <div className="page-shell cr-shell">
        <ControlRoomHeader name={viewer.name} role={viewer.role} sections={controlRoomSections(viewer.role)} />
        <DashboardContent>{children}</DashboardContent>
      </div>
      {modal}
    </DashboardShell>
    </DashboardNotifications>
  );
}
