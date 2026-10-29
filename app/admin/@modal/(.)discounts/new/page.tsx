import { requireControlRoom } from "@/app/admin/access";
import EditorPage from "@/app/admin/discounts/new/page";
import { RouteEditorDialog } from "@/components/control-room/editor-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "New discount code" };

export default async function CreateDiscountDialog() {
  await requireControlRoom("manage_catalog", "/admin/discounts/new");
  return <RouteEditorDialog title="crsNewDiscount" fullPageHref="/admin/discounts/new"><EditorPage /></RouteEditorDialog>;
}
