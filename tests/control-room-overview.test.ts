import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { translations } from "@/lib/i18n";

vi.mock("server-only", () => ({}));
vi.mock("@/app/admin/actions", () => ({}));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en" }) }));

import { ControlRoomOverview, type OverviewData } from "@/components/control-room/overview";
import { recentDays } from "@/lib/dashboard-series";

const days = recentDays(30, new Date("2026-10-20T06:00:00Z"));
const series = (values: Record<number, number>) => days.map((day, index) => ({ day, value: values[index] ?? 0 }));

const data: OverviewData = {
  stats: { totalOrders: 3, paidOrders: 2, totalProducts: 9 },
  orders: {
    orders: series({ 28: 2, 29: 1 }),
    revenueMinor: series({ 29: 690000 }),
    currency: "LKR",
    statuses: { pending: 1, paid: 1, fulfilled: 1, cancelled: 0, refunded: 0 },
  },
  catalog: { total: 9, active: 8, drafts: 1, archived: 0, noPhotos: [{ id: "a", name: "Naga Guard Tee" }], missingAlt: [], outOfStock: [] },
  activity: [{ id: 1, action: "content.publish", entityType: "page", entityId: "cms:page:home", actorEmail: "dev@example.com", targetEmail: null, from: null, to: null, subject: "cms:page:home", createdAt: "2026-10-19T10:00:00Z" }],
};

describe("Control Room overview", () => {
  it("charts every day and only shows what the data includes", () => {
    const html = renderToStaticMarkup(createElement(ControlRoomOverview, { name: "Kavisha Liyanage", role: "web_dev", data: { kind: "ready", data } }));
    expect(html).toContain("Welcome back, Kavisha");
    expect(html.match(/class="cr-chart-bar/g)).toHaveLength(30);
    expect(html).toContain("cr-secondary-line");
    expect(html.match(/<th scope="row">/g)).toHaveLength(30);
    expect(html).toContain("cr-donut-ring");
    expect(html).toContain(translations.en.crPeriodDays(7));
    expect(html).toContain(translations.en.crPeriodDays(30));
    expect(html).toContain("LKR");
    expect(html).toContain("Naga Guard Tee");
    expect(html).toContain("Content published");
    expect(html).toContain(">home<");
    // No subscriber or message data was loaded, so neither chart is drawn.
    expect(html).not.toContain(translations.en.crChartSignups);
    expect(html).not.toContain(translations.en.crStatActiveSubscribers);
  });

  it("keeps the shortcuts when live data is unavailable", () => {
    const html = renderToStaticMarkup(createElement(ControlRoomOverview, { name: "Sam", role: "staff", data: { kind: "preview" } }));
    expect(html).toContain(translations.en.crPreviewTitle);
    expect(html).toContain(translations.en.crQuickTitle);
    expect(html).not.toContain("cr-health");
  });
});
