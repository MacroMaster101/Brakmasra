import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { translations } from "@/lib/i18n";
import { can, MEMBER_ROLES, type MemberRole, type Permission } from "@/lib/roles";

const state = vi.hoisted(() => ({ role: "web_dev" as string | null }));
const loaders = vi.hoisted(() => ({
  countNewMessages: vi.fn(async () => 2),
  orderCounts: vi.fn(async () => ({ total: 3, paid: 2 })),
  countActiveSubscribers: vi.fn(async () => 5),
  listOrders: vi.fn(async () => []),
  productSalesActivity: vi.fn(async () => []),
  listTeam: vi.fn(async () => ({ members: [], truncated: false })),
  countCatalogProducts: vi.fn(async () => 9),
  orderActivity: vi.fn(async () => ({ orders: [], revenueMinor: [], currency: "LKR", statuses: { pending: 0, paid: 0, fulfilled: 0, cancelled: 0, refunded: 0 } })),
  subscriberActivity: vi.fn(async () => []),
  messageActivity: vi.fn(async () => []),
  recentAuditLogs: vi.fn(async () => []),
  catalogHealth: vi.fn(async () => ({ total: 9, active: 9, drafts: 0, archived: 0, noPhotos: [], missingAlt: [], outOfStock: [] })),
  listContentEntries: vi.fn(async () => []),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/admin/actions", () => ({}));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en" }) }));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NOT_FOUND"); },
  redirect: (to: string) => { throw new Error(`REDIRECT:${to}`); },
}));
vi.mock("@/lib/features", () => ({ authEnabled: true, authDemoMode: false, launchMode: false, commerceEnabled: true }));
vi.mock("@/lib/member", () => ({
  getCurrentMember: async () => (state.role === "signed-out" ? null : { id: "member", name: "Sam Perera", email: "sam@example.com", role: state.role }),
}));
vi.mock("@/lib/control-room", () => ({ ...loaders, controlRoomConfigured: () => true }));
vi.mock("@/lib/store-admin", () => ({ catalogHealth: loaders.catalogHealth }));
vi.mock("@/lib/content", () => ({ listContentEntries: loaders.listContentEntries, unpublishedDrafts: () => [] }));

import { requireControlRoom } from "@/app/admin/access";
import ControlRoomOverviewPage from "@/app/admin/page";

const t = translations.en;
const STAFF: MemberRole[] = ["web_dev", "owner", "staff"];

async function overviewHtml(role: MemberRole) {
  state.role = role;
  const element = await ControlRoomOverviewPage();
  expect(isValidElement(element)).toBe(true);
  return renderToStaticMarkup(element as ReactElement);
}

/** Every admin page and the permission its server check asks for. */
function adminPages() {
  const pages: { route: string; permission: Permission }[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name === "page.tsx") {
        const match = readFileSync(path, "utf8").match(/requireControlRoom\("([a-z_]+)"/);
        if (!match) throw new Error(`${path} has no requireControlRoom check`);
        pages.push({ route: dir.replace(/\\/g, "/").replace(/^.*app/, "") || "/", permission: match[1] as Permission });
      }
    }
  };
  walk(join(process.cwd(), "app/admin"));
  return pages;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Control Room overview for each role", () => {
  it("Web Dev sees everything, including site health, content drafts and activity", async () => {
    const html = await overviewHtml("web_dev");
    for (const loader of Object.values(loaders)) expect(loader).toHaveBeenCalled();
    for (const text of [t.crStatTotalOrders, t.crKpiRevenue, t.crStatActiveSubscribers, t.crStatNewMessages, t.crTabProducts, t.crStatRoleHolders, t.crHealthTitle, t.crHealthContentDrafts, t.crActivityTitle, t.crsNewProduct, t.crTabContent]) {
      expect(html).toContain(text);
    }
  });

  it("Owner sees the store, audience, team and catalog health, but no site tools", async () => {
    const html = await overviewHtml("owner");
    expect(loaders.catalogHealth).toHaveBeenCalled();
    expect(loaders.listTeam).toHaveBeenCalled();
    expect(loaders.listContentEntries).not.toHaveBeenCalled();
    expect(loaders.recentAuditLogs).not.toHaveBeenCalled();
    expect(html).toContain(t.crHealthNoPhotos);
    expect(html).toContain(t.crsNewProduct);
    for (const hidden of [t.crHealthContentDrafts, t.crActivityTitle, 'href="/admin/content"', 'href="/admin/site"']) expect(html).not.toContain(hidden);
  });

  it("Staff only read orders, messages and the catalog: no subscribers, team, health or editing", async () => {
    const html = await overviewHtml("staff");
    expect(loaders.orderActivity).toHaveBeenCalled();
    expect(loaders.messageActivity).toHaveBeenCalled();
    expect(loaders.countCatalogProducts).toHaveBeenCalled();
    for (const loader of [loaders.countActiveSubscribers, loaders.subscriberActivity, loaders.listTeam, loaders.catalogHealth, loaders.listContentEntries, loaders.recentAuditLogs]) {
      expect(loader).not.toHaveBeenCalled();
    }
    expect(html).toContain(t.crStatTotalOrders);
    expect(html).toContain(t.crStatNewMessages);
    for (const hidden of [t.crStatActiveSubscribers, t.crStatRoleHolders, t.crHealthTitle, t.crsNewProduct, 'href="/admin/products/new"', 'href="/admin/subscribers"', 'href="/admin/team"']) {
      expect(html).not.toContain(hidden);
    }
  });

  it("Supporters, regular members and signed-out visitors never reach the overview", async () => {
    for (const role of ["supporter", null] as const) {
      state.role = role;
      await expect(ControlRoomOverviewPage()).rejects.toThrow("NOT_FOUND");
    }
    state.role = "signed-out";
    await expect(ControlRoomOverviewPage()).rejects.toThrow("REDIRECT:/login?next=/admin");
    expect(loaders.orderCounts).not.toHaveBeenCalled();
  });
});

describe("Every admin page against every role", () => {
  const pages = adminPages();

  it("finds every admin page", () => {
    expect(pages.length).toBeGreaterThanOrEqual(18);
  });

  for (const role of MEMBER_ROLES) {
    it(`${role} opens exactly the pages its role allows`, async () => {
      state.role = role;
      for (const { route, permission } of pages) {
        const allowed = STAFF.includes(role) && can(role, permission);
        const check = requireControlRoom(permission, route);
        if (allowed) await expect(check, route).resolves.toMatchObject({ role });
        else await expect(check, route).rejects.toThrow("NOT_FOUND");
      }
    });
  }

  it("only Web Dev can open the site tools, and only Owner and Web Dev can edit the catalog", () => {
    const open = (role: MemberRole) => pages.filter(({ permission }) => can(role, permission)).map(({ route }) => route);
    expect(open("staff")).not.toContain("/admin/products/new");
    expect(open("staff")).not.toContain("/admin/team");
    expect(open("owner")).not.toContain("/admin/site");
    expect(open("owner")).not.toContain("/admin/content");
    expect(open("web_dev")).toEqual(pages.map(({ route }) => route));
  });
});
