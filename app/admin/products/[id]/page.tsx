import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ProductEditor } from "@/components/control-room/product-editor";
import { can } from "@/lib/roles";
import { getAdminProduct } from "@/lib/store-admin";
import { idSchema } from "@/lib/store-admin-validation";

export const metadata: Metadata = { title: "Edit product", robots: noIndex };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const viewer = await requireControlRoom("view_catalog", "/admin/products");
  if (!idSchema.safeParse({ id }).success) notFound();

  const product = await loadSection(async () => {
    const result = await getAdminProduct(id);
    if (result === "missing") notFound();
    return result;
  });

  return (
    <ProductEditor
      data={product}
      canManage={can(viewer.role, "manage_catalog")}
      notice={query.created === "1" ? "crsProductCreated" : null}
    />
  );
}
