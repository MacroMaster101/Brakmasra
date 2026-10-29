import { requireControlRoom } from "@/app/admin/access";
import EditorPage from "@/app/admin/collections/new/page";
import { RouteEditorDialog } from "@/components/control-room/editor-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "New collection" };

export default async function CreateCollectionDialog() {
  await requireControlRoom("manage_catalog", "/admin/collections/new");
  return <RouteEditorDialog title="crsNewCollection" fullPageHref="/admin/collections/new"><EditorPage /></RouteEditorDialog>;
}
