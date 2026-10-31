import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { translations } from "@/lib/i18n";
import { controlRoomSections } from "@/lib/control-room-validation";
import { dashboardDestinations } from "@/lib/dashboard-navigation";
import type { MemberRole } from "@/lib/roles";
vi.mock("next/navigation", () => ({ usePathname: () => "/admin" }));
vi.mock("@/app/auth/actions", () => ({ logoutAction: vi.fn() }));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en", setLang: vi.fn() }) }));
import { DashboardShell } from "@/components/control-room/dashboard-shell";
import { DashboardToolbar } from "@/components/control-room/dashboard-toolbar";
import { ControlRoomHeader } from "@/components/control-room/control-room-header";
import { AreaChart, DonutChart } from "@/components/control-room/charts";
const t = translations.en;
function frame(role: MemberRole) {
 const member = { name: "Sam Perera", email: "sam@example.com", initials: "SP", role, avatarUrl: null };
 return renderToStaticMarkup(<DashboardShell><DashboardToolbar member={member} unread={3} /><ControlRoomHeader name={member.name} role={role} sections={controlRoomSections(role)} /></DashboardShell>);
}
describe("dashboard navigation and identity", () => {
 it("restricts search and create destinations to actual role permissions", () => {
   const developer = dashboardDestinations("web_dev").map(item => item.href);
   const owner = dashboardDestinations("owner").map(item => item.href);
   const staff = dashboardDestinations("staff").map(item => item.href);
   expect(developer).toContain("/admin/site"); expect(developer).toContain("/admin/content");
   expect(owner).toContain("/admin/products/new"); expect(owner).toContain("/admin/content"); expect(owner).not.toContain("/admin/site");
   expect(staff).toContain("/admin/products"); expect(staff).not.toContain("/admin/products/new"); expect(staff).not.toContain("/admin/team");
   expect(dashboardDestinations("supporter")).toEqual([]);
 });
 it("renders working sidebar controls, the signed-in account, and actual unread counts", () => {
   const html = frame("web_dev");
   expect(html).toContain(t.crCollapseSidebar); expect(html).toContain(t.crFindPage);
   expect(html).toContain(`${t.navAccountMenu}: Sam Perera`);
   expect(html).toContain(t.crUnreadMessages(3)); expect(html).toContain("/admin/products/new");
   expect(html).toContain("dashboard-nav-section"); expect(html).toContain("BRAKMASRA");
 });
 it("sends the BRAKMASRA title to the website home page", () => {
   const html = frame("owner");
   for (const brand of ["dashboard-sidebar-brand", "dashboard-mobile-brand"]) {
     expect(html.match(new RegExp(`<a[^>]*${brand}[^>]*>`))?.[0]).toContain('href="/"');
   }
 });
 it("does not expose developer tools or catalog create shortcuts in the staff sidebar", () => {
   const html = frame("staff");
   expect(html).not.toContain('href="/admin/site"'); expect(html).not.toContain('href="/admin/content"');
   expect(html).not.toContain('href="/admin/products/new"'); expect(html).toContain('href="/admin/products"');
 });
});
describe("dashboard chart truthfulness and accessibility", () => {
 it("includes every original daily amount in an accessible revenue table", () => {
   const html = renderToStaticMarkup(createElement(AreaChart, { points: [{ day: "2026-10-20", value: 1500 }, { day: "2026-10-21", value: 0 }, { day: "2026-10-22", value: 2250 }], title: "Revenue", empty: "No revenue", format: (value: number) => `LKR ${value}` }));
   expect(html.match(/<th scope="row">/g)).toHaveLength(3);
   for (const value of ["LKR 1500", "LKR 0", "LKR 2250"]) expect(html).toContain(value);
   expect(html).toContain("LKR 3750"); expect(html).toContain(t.crChartKeyboardHint);
 });
 it("shows empty area and status charts without fabricated positive activity or invalid geometry", () => {
   const area = renderToStaticMarkup(createElement(AreaChart, { points: [], title: "Revenue", empty: "No revenue yet", format: String }));
   const donut = renderToStaticMarkup(createElement(DonutChart, { items: [{ key: "paid", label: "Paid", value: 0, tone: "success" }], title: "Orders", empty: "No orders yet" }));
   expect(area).toContain("No revenue yet"); expect(area).not.toContain("cr-area-line");
   expect(donut).toContain("No orders yet"); expect(donut).not.toContain("conic-gradient");
   expect(area + donut).not.toMatch(/NaN|Infinity/);
 });
 it("calculates status shares from actual counts", () => {
   const html = renderToStaticMarkup(createElement(DonutChart, { items: [{ key: "paid", label: "Paid", value: 3, tone: "success" }, { key: "pending", label: "Pending", value: 1, tone: "warning" }], title: "Orders", empty: "Empty" }));
   expect(html).toContain("75%"); expect(html).toContain("25%"); expect(html).toContain(">4<");
 });
});
