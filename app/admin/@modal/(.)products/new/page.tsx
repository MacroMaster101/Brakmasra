import { requireControlRoom } from "@/app/admin/access";
import EditorPage from "@/app/admin/products/new/page";
import { RouteEditorDialog } from "@/components/control-room/editor-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function CreateProductDialog() {
  await requireControlRoom("manage_catalog", "/admin/products/new");
  return <RouteEditorDialog title="crsNewProduct" fullPageHref="/admin/products/new"><EditorPage /></RouteEditorDialog>;
}
