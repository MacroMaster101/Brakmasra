import { requireControlRoom } from "@/app/admin/access";
import EditorPage from "@/app/admin/products/[id]/page";
import { RouteEditorDialog } from "@/components/control-room/editor-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function EditProductDialog(props: Props) {
  const { id } = await props.params;
  await requireControlRoom("view_catalog", "/admin/products");
  return <RouteEditorDialog key={id} title="crsEditProduct" fullPageHref={`/admin/products/${id}`}><EditorPage {...props} /></RouteEditorDialog>;
}
