import { loadSection, requireControlRoom, noIndex } from "@/app/admin/access";
import { ContentManager } from "@/components/control-room/content-manager";
import { listAdminProducts } from "@/lib/store-admin";
import { listContentEntries } from "@/lib/content";
export const metadata = { title: "Website content", robots: noIndex };
export default async function ContentPage() {
  await requireControlRoom("manage_site", "/admin/content");
  const [entries, products] = await Promise.all([loadSection(listContentEntries), listAdminProducts()]);
  return <ContentManager entries={entries} products={(products ?? []).map(({ slug, name, image }) => ({ slug, name, image }))} />;
}
