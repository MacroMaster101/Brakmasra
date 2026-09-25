import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomOrderDetail } from "@/components/control-room/order-detail";
import { can } from "@/lib/roles";
import { getAdminOrder } from "@/lib/store-admin";

export const metadata: Metadata = { title: "Order", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomOrderPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId: raw } = await params;
  const viewer = await requireControlRoom("view_orders", "/admin/orders");
  const publicId = decodeURIComponent(raw);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(publicId)) notFound();

  const order = await loadSection(async () => {
    const result = await getAdminOrder(publicId);
    if (result === "missing") notFound();
    return result;
  });

  return <ControlRoomOrderDetail data={order} canManage={can(viewer.role, "manage_orders")} />;
}
