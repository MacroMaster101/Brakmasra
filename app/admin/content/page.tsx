import { loadSection, requireControlRoom, noIndex } from "@/app/admin/access";
import { ContentManager } from "@/components/control-room/content-manager";
import { listContentEntries } from "@/lib/content";
export const metadata = { title: "Website content", robots: noIndex };
export default async function ContentPage() {
  await requireControlRoom("manage_site", "/admin/content");
  return <ContentManager entries={await loadSection(listContentEntries)} />;
}
