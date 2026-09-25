import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomProducts } from "@/components/control-room/products";
import { can } from "@/lib/roles";
import { listAdminProducts } from "@/lib/store-admin";

export const metadata: Metadata = { title: "Products", robots: noIndex };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ControlRoomProductsPage({ searchParams }: Props) {
  const viewer = await requireControlRoom("view_catalog", "/admin/products");
  const [products, params] = await Promise.all([loadSection(listAdminProducts), searchParams]);

  return (
    <ControlRoomProducts
      products={products}
      canManage={can(viewer.role, "manage_catalog")}
      notice={params.deleted === "1" ? "crsProductDeleted" : null}
    />
  );
}
