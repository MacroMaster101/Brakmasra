"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { SectionGate, SectionPanel } from "@/components/control-room/shared";
import type { SectionData } from "@/lib/control-room-validation";
import type { TextKey } from "@/lib/i18n";
import { can, type MemberRole } from "@/lib/roles";

/** Only the numbers the viewer's role may see are present. */
export type OverviewStats = {
  newMessages?: number | null;
  totalOrders?: number | null;
  paidOrders?: number | null;
  activeSubscribers?: number | null;
  roleHolders?: number | null;
};

const statCards: { key: keyof OverviewStats; label: TextKey; hint?: TextKey; href: string }[] = [
  { key: "newMessages", label: "crStatNewMessages", href: "/admin/messages?status=new" },
  { key: "totalOrders", label: "crStatTotalOrders", href: "/admin/orders" },
  { key: "paidOrders", label: "crStatPaidOrders", hint: "crStatPaidOrdersHint", href: "/admin/orders" },
  { key: "activeSubscribers", label: "crStatActiveSubscribers", href: "/admin/subscribers" },
  { key: "roleHolders", label: "crStatRoleHolders", href: "/admin/team" },
];

// Same digits and grouping on the server and in every browser, so hydration always matches.
function formatCount(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function accessItems(role: MemberRole): TextKey[] {
  const items: TextKey[] = [];
  if (can(role, "view_messages")) items.push("crAccessMessages");
  if (can(role, "view_orders")) items.push("crAccessOrders");
  if (can(role, "view_newsletter")) items.push("crAccessNewsletter");
  if (can(role, "manage_team")) items.push(role === "web_dev" ? "crAccessTeamWebDev" : "crAccessTeamOwner");
  if (can(role, "manage_site")) items.push("crAccessSite");
  return items;
}

export function ControlRoomOverview({ role, stats }: { role: MemberRole; stats: SectionData<OverviewStats> }) {
  const { t } = useLanguage();

  return (
    <>
      <SectionPanel id="cr-overview-title" title="crOverviewTitle" desc="crOverviewDesc">
        <SectionGate data={stats}>
          {(values) => (
            <ul className="cr-stats">
              {statCards.filter(({ key }) => key in values).map(({ key, label, hint, href }) => {
                const value = values[key];
                return (
                  <li key={key}>
                    <Link href={href} className="cr-stat">
                      <span className="cr-stat-label">{t[label]}</span>
                      <strong className={value === null || value === undefined ? "is-unavailable" : undefined}>
                        {value === null || value === undefined ? t.crUnavailable : formatCount(value)}
                      </strong>
                      {hint && <small>{t[hint]}</small>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionGate>
      </SectionPanel>

      <SectionPanel id="cr-access-title" title="crAccessTitle" desc="crAccessDesc">
        <ul className="cr-access">
          {accessItems(role).map((item) => (
            <li key={item}>
              <Check aria-hidden="true" />
              <span>{t[item]}</span>
            </li>
          ))}
        </ul>
      </SectionPanel>
    </>
  );
}
