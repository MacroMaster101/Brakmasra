import { requireControlRoom } from "@/app/admin/access";
import EditorPage from "@/app/admin/collections/[id]/page";
import { RouteEditorDialog } from "@/components/control-room/editor-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit collection" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function EditCollectionDialog(props: Props) {
  const { id } = await props.params;
  await requireControlRoom("view_catalog", "/admin/collections");
  return <RouteEditorDialog key={id} title="crsEditCollection" fullPageHref={`/admin/collections/${id}`}><EditorPage {...props} /></RouteEditorDialog>;
}
