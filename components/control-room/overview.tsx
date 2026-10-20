"use client";

import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Info, ScrollText, type LucideIcon } from "lucide-react";

import { AuditAction, AuditChange, hasAuditDetail } from "@/components/control-room/audit";
import { BarChart, Breakdown, Sparkline, type BreakdownItem, type ChartTone } from "@/components/control-room/charts";
import { orderStatusLabels } from "@/components/control-room/orders";
import { EmptyState, SectionGate, SectionPanel } from "@/components/control-room/shared";
import { useLanguage } from "@/components/language-provider";
import { formatMoney } from "@/lib/cart";
import type { AuditEntry, OrderActivity } from "@/lib/control-room";
import type { SectionData } from "@/lib/control-room-validation";
import { seriesTotal, type DayPoint } from "@/lib/dashboard-series";
import { formatDate, type TextKey } from "@/lib/i18n";
import { ORDER_STATUS_VALUES, type OrderStatusValue } from "@/lib/order-status";
import { can, type MemberRole } from "@/lib/roles";
import type { CatalogHealth } from "@/lib/store-admin";

/** Only the numbers the viewer's role may see are present. */
export type OverviewStats = {
  totalProducts?: number | null;
  newMessages?: number | null;
  totalOrders?: number | null;
  paidOrders?: number | null;
  activeSubscribers?: number | null;
  roleHolders?: number | null;
};

/** Each field is present only when the role may see it; null means it failed to load. */
export type OverviewData = {
  stats: OverviewStats;
  orders?: OrderActivity | null;
  subscribers?: DayPoint[] | null;
  messages?: DayPoint[] | null;
  catalog?: CatalogHealth | null;
  drafts?: number | null;
  setup?: { ready: number; total: number; missing: TextKey[] };
  activity?: AuditEntry[] | null;
};

const statusTones: Record<OrderStatusValue, ChartTone> = {
  pending: "warning",
  paid: "success",
  fulfilled: "info",
  cancelled: "muted",
  refunded: "accent",
};

// Same digits and grouping on the server and in every browser, so hydration always matches.
function formatCount(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`;
  return Number.isInteger(value) ? formatCount(value) : String(Number(value.toFixed(1)));
}

function accessItems(role: MemberRole): TextKey[] {
  const items: TextKey[] = [];
  if (can(role, "view_messages")) items.push("crAccessMessages");
  if (can(role, "view_orders")) items.push("crAccessOrders");
  if (can(role, "manage_catalog")) items.push("crAccessCatalog");
  if (can(role, "view_newsletter")) items.push("crAccessNewsletter");
  if (can(role, "manage_team")) items.push(role === "web_dev" ? "crAccessTeamWebDev" : "crAccessTeamOwner");
  if (can(role, "manage_site")) items.push("crAccessSite");
  return items;
}

type Kpi = { key: string; label: string; value: string | null; hint?: string; href: string; series?: DayPoint[] | null; tone?: ChartTone };

function KpiCards({ items }: { items: Kpi[] }) {
  const { t } = useLanguage();
  return (
    // Rows stay even: every card on one wide row, otherwise rows of two or three.
    <ul className="cr-kpis" style={{ "--kpi-count": items.length, "--kpi-mid": items.length % 3 === 0 || items.length > 4 ? 3 : 2 } as React.CSSProperties}>
      {items.map(({ key, label, value, hint, href, series, tone }) => (
        <li key={key}>
          <Link href={href} className="cr-kpi">
            <span className="cr-kpi-label">{label}</span>
            <strong className={value === null ? "is-unavailable" : undefined}>{value ?? t.crUnavailable}</strong>
            {hint && <small>{hint}</small>}
            {series && <Sparkline points={series} tone={tone} />}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Unavailable() {
  return <EmptyState icon={CircleAlert} title="crLoadErrorTitle" desc="crLoadErrorDesc" />;
}

type HealthItem = { key: string; label: string; count: number | null; href: string; names?: string[]; tone: "check" | "info" };

function SiteHealth({ items }: { items: HealthItem[] }) {
  const { t } = useLanguage();
  const scored = items.filter((item) => item.tone === "check" && item.count !== null);
  const passing = scored.filter((item) => item.count === 0).length;

  return (
    <SectionPanel
      id="cr-health-title"
      title="crHealthTitle"
      desc="crHealthDesc"
      actions={scored.length > 0 && <span className={`cr-health-score${passing === scored.length ? " is-clear" : ""}`}>{t.crHealthScore(passing, scored.length)}</span>}
    >
      <ul className="cr-health">
        {items.map((item) => {
          const state = item.count === null ? "unknown" : item.tone === "info" ? "info" : item.count === 0 ? "ok" : "warn";
          const Icon: LucideIcon = state === "ok" ? Check : state === "info" ? Info : CircleAlert;
          const extra = (item.names?.length ?? 0) - 3;
          return (
            <li key={item.key} data-state={state}>
              <Link href={item.href}>
                <Icon aria-hidden="true" />
                <span className="cr-health-copy">
                  <span>{item.label}</span>
                  {state === "warn" && item.names && item.names.length > 0 && (
                    <small>{item.names.slice(0, 3).join(", ")}{extra > 0 ? ` ${t.crHealthMore(extra)}` : ""}</small>
                  )}
                </span>
                <strong>{item.count === null ? t.crUnavailable : state === "ok" ? t.crHealthAllGood : formatCount(item.count)}</strong>
                <ArrowRight aria-hidden="true" className="cr-health-go" />
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionPanel>
  );
}

function RecentActivity({ entries }: { entries: AuditEntry[] | null }) {
  const { t, lang } = useLanguage();
  return (
    <SectionPanel
      id="cr-activity-title"
      title="crActivityTitle"
      desc="crActivityDesc"
      actions={<Link className="cms-link" href="/admin/site">{t.crActivityAll}</Link>}
    >
      {entries === null ? <Unavailable /> : entries.length === 0
        ? <EmptyState icon={ScrollText} title="crAuditEmpty" desc="crAuditEmptyDesc" />
        : (
          <ol className="cr-activity">
            {entries.map((entry) => (
              <li key={entry.id}>
                <span className="cr-activity-dot" aria-hidden="true" />
                <div>
                  <strong><AuditAction action={entry.action} /></strong>
                  {hasAuditDetail(entry) && <span className="cr-activity-change"><AuditChange entry={entry} /></span>}
                  <small>
                    <span className="cr-break">{entry.actorEmail ?? "–"}</span>
                    {" · "}
                    <time dateTime={entry.createdAt}>{formatDate(entry.createdAt, lang)}</time>
                  </small>
                </div>
              </li>
            ))}
          </ol>
        )}
    </SectionPanel>
  );
}

function Hero({ name }: { name: string }) {
  const { t } = useLanguage();
  return (
    <header className="cr-hero">
      <span className="eyebrow">{t.crOverviewEyebrow}</span>
      <h2 id="cr-overview-title">{t.crWelcome(name.split(" ")[0] || name)}</h2>
      <p>{t.crWelcomeDesc}</p>
    </header>
  );
}

function Dashboard({ name, role, data }: { name: string; role: MemberRole; data: OverviewData }) {
  const { t } = useLanguage();
  const { stats, orders, subscribers, messages, catalog } = data;
  const money = (minor: number) => formatMoney(minor, orders?.currency ?? "LKR");

  const kpis: Kpi[] = [];
  if ("totalOrders" in stats) {
    kpis.push({
      key: "orders",
      label: t.crStatTotalOrders,
      value: stats.totalOrders == null ? null : formatCount(stats.totalOrders),
      hint: orders ? t.crKpiOrders30(seriesTotal(orders.orders)) : undefined,
      href: "/admin/orders",
      series: orders?.orders,
    });
    kpis.push({
      key: "revenue",
      label: t.crKpiRevenue,
      value: orders ? money(seriesTotal(orders.revenueMinor)) : null,
      hint: t.crKpiRevenueHint,
      href: "/admin/orders",
      series: orders?.revenueMinor,
      tone: "success",
    });
  }
  if ("activeSubscribers" in stats) {
    kpis.push({
      key: "subscribers",
      label: t.crStatActiveSubscribers,
      value: stats.activeSubscribers == null ? null : formatCount(stats.activeSubscribers),
      hint: subscribers ? t.crKpiSubscribers30(seriesTotal(subscribers)) : undefined,
      href: "/admin/subscribers",
      series: subscribers,
      tone: "info",
    });
  }
  if ("newMessages" in stats) {
    kpis.push({
      key: "messages",
      label: t.crStatNewMessages,
      value: stats.newMessages == null ? null : formatCount(stats.newMessages),
      hint: messages ? t.crKpiMessages30(seriesTotal(messages)) : undefined,
      href: "/admin/messages?status=new",
      series: messages,
      tone: "warning",
    });
  }
  if ("totalProducts" in stats) {
    kpis.push({
      key: "products",
      label: t.crTabProducts,
      value: stats.totalProducts == null ? null : formatCount(stats.totalProducts),
      hint: catalog ? t.crKpiProductsHint(catalog.active, catalog.drafts) : undefined,
      href: "/admin/products",
    });
  }
  if ("roleHolders" in stats) {
    kpis.push({
      key: "team",
      label: t.crStatRoleHolders,
      value: stats.roleHolders == null ? null : formatCount(stats.roleHolders),
      href: "/admin/team",
    });
  }

  const statusItems: BreakdownItem[] = orders
    ? ORDER_STATUS_VALUES.map((status) => ({ key: status, label: t[orderStatusLabels[status]], value: orders.statuses[status], tone: statusTones[status] }))
    : [];

  const health: HealthItem[] = [];
  if (catalog !== undefined) {
    health.push(
      { key: "photos", label: t.crHealthNoPhotos, count: catalog?.noPhotos.length ?? null, names: catalog?.noPhotos.map((item) => item.name), href: "/admin/products", tone: "check" },
      { key: "alt", label: t.crHealthMissingAlt, count: catalog?.missingAlt.length ?? null, names: catalog?.missingAlt.map((item) => item.name), href: "/admin/products", tone: "check" },
      { key: "stock", label: t.crHealthOutOfStock, count: catalog?.outOfStock.length ?? null, names: catalog?.outOfStock.map((item) => item.name), href: "/admin/products", tone: "check" },
    );
  }
  if (data.drafts !== undefined) {
    health.push({ key: "content", label: t.crHealthContentDrafts, count: data.drafts, href: "/admin/content", tone: "check" });
  }
  if (data.setup) {
    health.push({
      key: "setup",
      label: t.crHealthSetup(data.setup.ready, data.setup.total),
      count: data.setup.total - data.setup.ready,
      names: data.setup.missing.map((label) => t[label]),
      href: "/admin/site",
      tone: "check",
    });
  }
  if (catalog) {
    health.push({ key: "drafts", label: t.crHealthDraftProducts, count: catalog.drafts, href: "/admin/products", tone: "info" });
  }

  const hasAudience = subscribers !== undefined || messages !== undefined;

  return (
    <>
      <Hero name={name} />

      {kpis.length > 0 && <KpiCards items={kpis} />}

      {orders !== undefined && (
        <div className="cr-grid">
          <SectionPanel id="cr-orders-chart" title="crChartOrdersTitle" desc="crChartOrdersDesc">
            {orders ? <BarChart points={orders.orders} title={t.crChartOrdersTitle} empty={t.crChartOrdersEmpty} format={formatCount} formatAxis={formatCompact} /> : <Unavailable />}
          </SectionPanel>
          <SectionPanel id="cr-revenue-chart" title="crChartRevenueTitle" desc="crChartRevenueDesc">
            {orders
              ? <BarChart points={orders.revenueMinor} title={t.crChartRevenueTitle} empty={t.crChartRevenueEmpty} format={money} formatAxis={(minor) => formatCompact(minor / 100)} tone="success" />
              : <Unavailable />}
          </SectionPanel>
        </div>
      )}

      {(orders !== undefined || hasAudience) && (
        <div className="cr-grid">
          {orders !== undefined && (
            <SectionPanel id="cr-status-chart" title="crChartStatusTitle" desc="crChartStatusDesc">
              {orders ? <Breakdown items={statusItems} empty={t.crChartStatusEmpty} /> : <Unavailable />}
            </SectionPanel>
          )}
          {hasAudience && (
            <SectionPanel id="cr-audience-chart" title="crChartAudienceTitle" desc="crChartAudienceDesc">
              <div className="cr-chart-stack">
                {subscribers !== undefined && (
                  <div>
                    <h3 className="cr-chart-heading">{t.crChartSignups}</h3>
                    {subscribers ? <BarChart points={subscribers} title={t.crChartSignups} empty={t.crChartSignupsEmpty} format={formatCount} formatAxis={formatCompact} tone="info" /> : <Unavailable />}
                  </div>
                )}
                {messages !== undefined && (
                  <div>
                    <h3 className="cr-chart-heading">{t.crChartMessages}</h3>
                    {messages ? <BarChart points={messages} title={t.crChartMessages} empty={t.crChartMessagesEmpty} format={formatCount} formatAxis={formatCompact} tone="warning" /> : <Unavailable />}
                  </div>
                )}
              </div>
            </SectionPanel>
          )}
        </div>
      )}

      {(health.length > 0 || data.activity !== undefined) && (
        <div className="cr-grid">
          {health.length > 0 && <SiteHealth items={health} />}
          {data.activity !== undefined && <RecentActivity entries={data.activity} />}
        </div>
      )}

      <QuickActions role={role} />
    </>
  );
}

function QuickActions({ role }: { role: MemberRole }) {
  const { t } = useLanguage();
  const links: { href: string; label: string }[] = [];
  if (can(role, "manage_catalog")) links.push({ href: "/admin/products/new", label: t.crsNewProduct }, { href: "/admin/collections/new", label: t.crsNewCollection });
  if (can(role, "manage_site")) links.push({ href: "/admin/content", label: t.crTabContent });
  if (can(role, "view_orders")) links.push({ href: "/admin/orders", label: t.crTabOrders });
  if (can(role, "view_messages")) links.push({ href: "/admin/messages?status=new", label: t.crTabMessages });

  return (
    <SectionPanel id="cr-quick-title" title="crQuickTitle" desc="crQuickDesc">
      <div className="dashboard-shortcuts">
        {links.map(({ href, label }) => <Link key={href} href={href}>{label} <ArrowRight aria-hidden="true" /></Link>)}
      </div>
      <details className="cr-access-details">
        <summary>{t.crAccessTitle}</summary>
        <ul className="cr-access">
          {accessItems(role).map((item) => (
            <li key={item}>
              <Check aria-hidden="true" />
              <span>{t[item]}</span>
            </li>
          ))}
        </ul>
      </details>
    </SectionPanel>
  );
}

export function ControlRoomOverview({ name, role, data }: { name: string; role: MemberRole; data: SectionData<OverviewData> }) {
  if (data.kind === "ready") return <Dashboard name={name} role={role} data={data.data} />;
  // Preview, setup and error states still show the shortcuts, which need no data.
  return (
    <>
      <Hero name={name} />
      <section className="panel cr-panel" aria-labelledby="cr-overview-title">
        <SectionGate data={data}>{() => null}</SectionGate>
      </section>
      <QuickActions role={role} />
    </>
  );
}
