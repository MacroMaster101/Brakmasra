import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomSubscribers, type SubscribersData } from "@/components/control-room/subscribers";
import { listSubscribers, subscriberCounts } from "@/lib/control-room";
import { can } from "@/lib/roles";

export const metadata: Metadata = { title: "Subscribers", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomSubscribersPage() {
  const viewer = await requireControlRoom("view_newsletter", "/admin/subscribers");
  const data = await loadSection<SubscribersData>(async () => {
    const [subscribers, counts] = await Promise.all([listSubscribers(), subscriberCounts()]);
    return subscribers ? { subscribers, counts } : null;
  });

  return <ControlRoomSubscribers data={data} canManage={can(viewer.role, "manage_newsletter")} />;
}
