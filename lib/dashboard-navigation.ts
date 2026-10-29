import type { TextKey } from "@/lib/i18n";
import { CONTROL_ROOM_SECTIONS, controlRoomSections } from "@/lib/control-room-validation";
import { can, type MemberRole } from "@/lib/roles";
export const dashboardLabels: Record<string, TextKey> = { overview: "crTabOverview", products: "crTabProducts", collections: "crTabCollections", discounts: "crTabDiscounts", orders: "crTabOrders", messages: "crTabMessages", subscribers: "crTabSubscribers", team: "crTabTeam", content: "crTabContent", site: "crTabSite" };
export const dashboardCreateLabels: Record<string, TextKey> = { products: "crsNewProduct", collections: "crsNewCollection", discounts: "crsNewDiscount" };
/** No search results or create shortcuts for pages outside the viewer's permissions. */
export function dashboardDestinations(role: MemberRole | null) {
  const allowed = controlRoomSections(role);
  return CONTROL_ROOM_SECTIONS.filter(section => allowed.includes(section.key)).flatMap(section => {
    const result: { href: string; label: TextKey; group: TextKey }[] = [{ href: section.href, label: dashboardLabels[section.key], group: "crDashboardPages" }];
    const create = dashboardCreateLabels[section.key];
    if (create && can(role, "manage_catalog")) result.push({ href: `${section.href}/new`, label: create, group: "crQuickTitle" });
    return result;
  });
}
