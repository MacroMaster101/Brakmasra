import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomOrders } from "@/components/control-room/orders";
import { listOrders } from "@/lib/control-room";

export const metadata: Metadata = { title: "Orders", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomOrdersPage() {
  await requireControlRoom("view_orders", "/admin/orders");
  const orders = await loadSection(listOrders);

  return <ControlRoomOrders orders={orders} />;
}
