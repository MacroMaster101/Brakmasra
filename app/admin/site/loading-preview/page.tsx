import { requireControlRoom, noIndex } from "@/app/admin/access";
import { LoadingPreview } from "@/components/control-room/loading-preview";
export const metadata = { title: "Loading previews", robots: noIndex };
export default async function Page() {
  await requireControlRoom("manage_site", "/admin/site/loading-preview");
  return <LoadingPreview />;
}
