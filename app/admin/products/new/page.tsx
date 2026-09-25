import type { Metadata } from "next";

import { noIndex, requireControlRoom } from "@/app/admin/access";
import { ProductEditor } from "@/components/control-room/product-editor";

export const metadata: Metadata = { title: "New product", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  // Only people who can add products see the empty form.
  await requireControlRoom("manage_catalog", "/admin/products/new");
  return <ProductEditor data={{ kind: "ready", data: null }} canManage notice={null} />;
}
