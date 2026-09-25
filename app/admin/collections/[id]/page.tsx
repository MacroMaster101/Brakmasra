import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { CollectionEditor } from "@/components/control-room/collections";
import { can } from "@/lib/roles";
import { getAdminCollection, listProductChoices } from "@/lib/store-admin";
import { idSchema } from "@/lib/store-admin-validation";

export const metadata: Metadata = { title: "Edit collection", robots: noIndex };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditCollectionPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const viewer = await requireControlRoom("view_catalog", "/admin/collections");
  if (!idSchema.safeParse({ id }).success) notFound();

  const data = await loadSection(async () => {
    const [collection, products] = await Promise.all([getAdminCollection(id), listProductChoices()]);
    if (collection === "missing") notFound();
    return collection && products ? { collection, products } : null;
  });

  return (
    <CollectionEditor
      data={data}
      canManage={can(viewer.role, "manage_catalog")}
      notice={query.created === "1" ? "crsCollectionCreated" : null}
    />
  );
}
