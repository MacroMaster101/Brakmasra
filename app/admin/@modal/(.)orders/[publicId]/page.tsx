import { requireControlRoom } from "@/app/admin/access";
import OrderPage from "@/app/admin/orders/[publicId]/page";
import { RouteEditorDialog } from "@/components/control-room/editor-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order details" };

type Props = { params: Promise<{ publicId: string }> };
export default async function OrderDialog(props: Props) {
  const { publicId } = await props.params;
  await requireControlRoom("view_orders", "/admin/orders");
  return <RouteEditorDialog key={publicId} title="crsOrderTitle" fullPageHref={`/admin/orders/${publicId}`}><OrderPage {...props} /></RouteEditorDialog>;
}
