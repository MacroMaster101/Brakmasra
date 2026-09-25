import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomDiscounts } from "@/components/control-room/discounts";
import { can } from "@/lib/roles";
import { listAdminDiscounts } from "@/lib/store-admin";

export const metadata: Metadata = { title: "Discount codes", robots: noIndex };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ControlRoomDiscountsPage({ searchParams }: Props) {
  const viewer = await requireControlRoom("view_catalog", "/admin/discounts");
  const [discounts, params] = await Promise.all([loadSection(listAdminDiscounts), searchParams]);
  const notice = params.created === "1" ? "crsDiscountCreated" : params.deleted === "1" ? "crsDiscountDeleted" : null;

  return <ControlRoomDiscounts discounts={discounts} canManage={can(viewer.role, "manage_catalog")} notice={notice} />;
}
