import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomCollections } from "@/components/control-room/collections";
import { can } from "@/lib/roles";
import { listAdminCollections } from "@/lib/store-admin";

export const metadata: Metadata = { title: "Collections", robots: noIndex };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ControlRoomCollectionsPage({ searchParams }: Props) {
  const viewer = await requireControlRoom("view_catalog", "/admin/collections");
  const [collections, params] = await Promise.all([loadSection(listAdminCollections), searchParams]);

  return (
    <ControlRoomCollections
      collections={collections}
      canManage={can(viewer.role, "manage_catalog")}
      notice={params.deleted === "1" ? "crsCollectionDeleted" : null}
    />
  );
}
