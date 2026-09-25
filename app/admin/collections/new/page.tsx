import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { CollectionEditor } from "@/components/control-room/collections";
import { listProductChoices } from "@/lib/store-admin";

export const metadata: Metadata = { title: "New collection", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function NewCollectionPage() {
  await requireControlRoom("manage_catalog", "/admin/collections/new");
  const data = await loadSection(async () => {
    const products = await listProductChoices();
    return products ? { collection: null, products } : null;
  });
  return <CollectionEditor data={data} canManage notice={null} />;
}
