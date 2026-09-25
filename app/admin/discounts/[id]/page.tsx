import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { DiscountEditor } from "@/components/control-room/discounts";
import { can } from "@/lib/roles";
import { getAdminDiscount } from "@/lib/store-admin";
import { idSchema } from "@/lib/store-admin-validation";

export const metadata: Metadata = { title: "Edit discount code", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireControlRoom("view_catalog", "/admin/discounts");
  if (!idSchema.safeParse({ id }).success) notFound();

  const discount = await loadSection(async () => {
    const result = await getAdminDiscount(id);
    if (result === "missing") notFound();
    return result;
  });

  return <DiscountEditor data={discount} canManage={can(viewer.role, "manage_catalog")} />;
}
