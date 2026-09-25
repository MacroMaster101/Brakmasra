import type { Metadata } from "next";

import { noIndex, requireControlRoom } from "@/app/admin/access";
import { DiscountEditor } from "@/components/control-room/discounts";

export const metadata: Metadata = { title: "New discount code", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function NewDiscountPage() {
  await requireControlRoom("manage_catalog", "/admin/discounts/new");
  return <DiscountEditor data={{ kind: "ready", data: null }} canManage />;
}
