import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { siteChecks } from "@/app/admin/site-checks";
import { ControlRoomOverview, type OverviewData } from "@/components/control-room/overview";
import { listContentEntries, unpublishedDrafts } from "@/lib/content";
import {
  countActiveSubscribers,
  countCatalogProducts,
  countNewMessages,
  listTeam,
  listOrders,
  productSalesActivity,
  messageActivity,
  orderActivity,
  orderCounts,
  recentAuditLogs,
  subscriberActivity,
} from "@/lib/control-room";
import { can } from "@/lib/roles";
import { catalogHealth } from "@/lib/store-admin";

export const metadata: Metadata = { title: "Control Room", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomOverviewPage() {
  const viewer = await requireControlRoom("control_room", "/admin");
  const { role } = viewer;
  const allowed = <T,>(permission: Parameters<typeof can>[1], load: () => Promise<T>) => (can(role, permission) ? load() : undefined);

  // Only the numbers this role may see are loaded at all.
  const data = await loadSection<OverviewData>(async () => {
    const now = new Date();
    const [newMessages, orders, activeSubscribers, team, totalProducts, orderSeries, subscriberSeries, messageSeries, catalog, content, activity, recentOrders, sales] = await Promise.all([
      allowed("view_messages", countNewMessages),
      allowed("view_orders", orderCounts),
      allowed("view_newsletter", countActiveSubscribers),
      allowed("manage_team", listTeam),
      allowed("view_catalog", countCatalogProducts),
      allowed("view_orders", () => orderActivity(now)),
      allowed("view_newsletter", () => subscriberActivity(now)),
      allowed("view_messages", () => messageActivity(now)),
      allowed("manage_catalog", catalogHealth),
      allowed("manage_site", listContentEntries),
      allowed("manage_site", () => recentAuditLogs(6)),
      allowed("view_orders", listOrders),
      allowed("view_orders", () => productSalesActivity(now)),
    ]);

    const values: OverviewData = { stats: {} };
    if (recentOrders !== undefined) values.recentOrders = recentOrders?.slice(0, 5) ?? null;
    if (sales !== undefined) values.sales = sales;
    if (totalProducts !== undefined) values.stats.totalProducts = totalProducts;
    if (newMessages !== undefined) values.stats.newMessages = newMessages;
    if (orders) {
      values.stats.totalOrders = orders.total;
      values.stats.paidOrders = orders.paid;
    }
    if (activeSubscribers !== undefined) values.stats.activeSubscribers = activeSubscribers;
    if (team !== undefined) values.stats.roleHolders = team?.members.length ?? null;
    if (orderSeries !== undefined) values.orders = orderSeries;
    if (subscriberSeries !== undefined) values.subscribers = subscriberSeries;
    if (messageSeries !== undefined) values.messages = messageSeries;
    if (catalog !== undefined) values.catalog = catalog;
    if (content !== undefined) values.drafts = content ? unpublishedDrafts(content).length : null;
    if (activity !== undefined) values.activity = activity;
    if (can(role, "manage_site")) {
      const setup = siteChecks().filter((check) => check.kind === "configured");
      values.setup = { ready: setup.filter((check) => check.value).length, total: setup.length, missing: setup.filter((check) => !check.value).map((check) => check.label) };
    }
    return values;
  });

  return <ControlRoomOverview name={viewer.name} role={role} data={data} />;
}
