import { requireControlRoom } from "@/app/admin/access";
import EditorPage from "@/app/admin/discounts/[id]/page";
import { RouteEditorDialog } from "@/components/control-room/editor-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit discount code" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function EditDiscountDialog(props: Props) {
  const { id } = await props.params;
  await requireControlRoom("view_catalog", "/admin/discounts");
  return <RouteEditorDialog key={id} title="crsEditDiscount" fullPageHref={`/admin/discounts/${id}`}><EditorPage {...props} /></RouteEditorDialog>;
}
