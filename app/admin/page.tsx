import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomOverview, type OverviewStats } from "@/components/control-room/overview";
import { countActiveSubscribers, countNewMessages, listTeam, orderCounts } from "@/lib/control-room";
import { can } from "@/lib/roles";

export const metadata: Metadata = { title: "Control Room", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomOverviewPage() {
  const viewer = await requireControlRoom("control_room", "/admin");
  const { role } = viewer;

  // Only the numbers this role may see are loaded at all.
  const stats = await loadSection<OverviewStats>(async () => {
    const [newMessages, orders, activeSubscribers, team] = await Promise.all([
      can(role, "view_messages") ? countNewMessages() : undefined,
      can(role, "view_orders") ? orderCounts() : undefined,
      can(role, "view_newsletter") ? countActiveSubscribers() : undefined,
      can(role, "manage_team") ? listTeam() : undefined,
    ]);
    const values: OverviewStats = {};
    if (newMessages !== undefined) values.newMessages = newMessages;
    if (orders) {
      values.totalOrders = orders.total;
      values.paidOrders = orders.paid;
    }
    if (activeSubscribers !== undefined) values.activeSubscribers = activeSubscribers;
    if (team !== undefined) values.roleHolders = team?.members.length ?? null;
    return values;
  });

  return <ControlRoomOverview role={role} stats={stats} />;
}
