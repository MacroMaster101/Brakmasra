import type { Metadata } from "next";

import { noIndex, requireControlRoom } from "@/app/admin/access";
import { DashboardToolbar } from "@/components/control-room/dashboard-toolbar";
import { DashboardNotifications } from "@/components/control-room/notifications";
import { ControlRoomHeader } from "@/components/control-room/control-room-header";
import { controlRoomSections } from "@/lib/control-room-validation";

export const metadata: Metadata = { title: "Control Room", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomLayout({ children }: { children: React.ReactNode }) {
  // Each page checks again: layouts don't re-run on every client navigation.
  const viewer = await requireControlRoom("control_room", "/admin");

  return (
    <DashboardNotifications>
    <section className="cr-page">
      <div className="page-shell cr-shell">
        <ControlRoomHeader name={viewer.name} role={viewer.role} sections={controlRoomSections(viewer.role)} />
        <div className="cr-content"><DashboardToolbar />{children}</div>
      </div>
    </section>
    </DashboardNotifications>
  );
}
