"use client";

import { ExternalLink, ScrollText } from "lucide-react";
import Link from "next/link";

import { AuditAction, AuditChange } from "@/components/control-room/audit";
import { EmptyState, SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { useLanguage } from "@/components/language-provider";
import type { AuditEntry } from "@/lib/control-room";
import type { SectionData } from "@/lib/control-room-validation";
import { formatDate, type TextKey } from "@/lib/i18n";

/** A yes/no fact about the setup. Never a value. */
export type SiteCheck = { label: TextKey; value: boolean; kind: "configured" | "switch" };

const dashboards = [
  { label: "Supabase", href: "https://supabase.com/dashboard" },
  { label: "Vercel", href: "https://vercel.com/dashboard" },
  { label: "Resend", href: "https://resend.com/emails" },
];

export function ControlRoomSite({ checks, audit }: { checks: SiteCheck[]; audit: SectionData<AuditEntry[]> }) {
  const { t, lang } = useLanguage();

  return (
    <>
      <p className="cms-notice">{t.crPaymentPending}</p>
      <Link href="/admin/site/loading-preview" className="cms-link">Loading-state previews →</Link>
      <SectionPanel id="cr-site-title" title="crSiteTitle" desc="crSiteDesc">
        <ul className="cr-checks">
          {checks.map(({ label, value, kind }) => (
            <li key={label}>
              <span>{t[label]}</span>
              <StatusPill tone={kind === "switch" ? (value ? "on" : "off") : (value ? "yes" : "no")}>
                {kind === "switch" ? (value ? t.crOn : t.crOff) : (value ? t.crConfigured : t.crNotConfigured)}
              </StatusPill>
            </li>
          ))}
        </ul>
      </SectionPanel>

      <SectionPanel id="cr-dashboards-title" title="crDashboardsTitle" desc="crDashboardsDesc">
        <div className="cr-dashboards">
          {dashboards.map(({ label, href }) => (
            <a key={href} className="button button-secondary" href={href} target="_blank" rel="noopener noreferrer">
              {label}
              <ExternalLink aria-hidden="true" />
              <span className="sr-only">{t.crOpensNewTab}</span>
            </a>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel id="cr-audit-title" title="crAuditTitle" desc="crAuditDesc">
        <SectionGate data={audit}>
          {(entries) => (entries.length === 0
            ? <EmptyState icon={ScrollText} title="crAuditEmpty" desc="crAuditEmptyDesc" />
            : (
              <table className="cr-table">
                <thead>
                  <tr>
                    <th scope="col">{t.crAuditAction}</th>
                    <th scope="col">{t.crAuditBy}</th>
                    <th scope="col">{t.crAuditChange}</th>
                    <th scope="col">{t.crAuditWhen}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td data-label={t.crAuditAction}><AuditAction action={entry.action} /></td>
                      <td data-label={t.crAuditBy} className="cr-break">{entry.actorEmail ?? "–"}</td>
                      <td data-label={t.crAuditChange}><AuditChange entry={entry} /></td>
                      <td data-label={t.crAuditWhen}>
                        <time dateTime={entry.createdAt}>{formatDate(entry.createdAt, lang)}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
        </SectionGate>
      </SectionPanel>
    </>
  );
}
