"use client";

import { ExternalLink, ScrollText } from "lucide-react";

import { messageStatusLabels } from "@/components/control-room/messages";
import { EmptyState, SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { useLanguage } from "@/components/language-provider";
import { roleLabelKey } from "@/components/role-badge";
import type { AuditEntry } from "@/lib/control-room";
import { MESSAGE_STATUSES, type MessageStatus, type SectionData } from "@/lib/control-room-validation";
import { formatDate, type TextKey } from "@/lib/i18n";
import { parseRole } from "@/lib/roles";

/** A yes/no fact about the setup. Never a value. */
export type SiteCheck = { label: TextKey; value: boolean; kind: "configured" | "switch" };

const dashboards = [
  { label: "Supabase", href: "https://supabase.com/dashboard" },
  { label: "Vercel", href: "https://vercel.com/dashboard" },
  { label: "Resend", href: "https://resend.com/emails" },
];

const auditActions: Record<string, TextKey> = {
  "role.change": "crAuditRoleChange",
  "message.status": "crAuditMessageStatus",
};

function AuditValue({ action, value }: { action: string; value: string | null }) {
  const { t } = useLanguage();
  if (action === "role.change") {
    const role = parseRole(value);
    return <>{role ? t[roleLabelKey(role)] : t.crRoleNone}</>;
  }
  if (action === "message.status" && (MESSAGE_STATUSES as readonly string[]).includes(value ?? "")) {
    return <>{t[messageStatusLabels[value as MessageStatus]]}</>;
  }
  return <>{value ?? "–"}</>;
}

export function ControlRoomSite({ checks, audit }: { checks: SiteCheck[]; audit: SectionData<AuditEntry[]> }) {
  const { t, lang } = useLanguage();

  return (
    <>
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
                      <td data-label={t.crAuditAction}>
                        <span className={Object.hasOwn(auditActions, entry.action) ? undefined : "cr-mono"}>
                          {Object.hasOwn(auditActions, entry.action) ? t[auditActions[entry.action]] : entry.action}
                        </span>
                      </td>
                      <td data-label={t.crAuditBy} className="cr-break">{entry.actorEmail ?? "–"}</td>
                      <td data-label={t.crAuditChange}>
                        <span>
                          <AuditValue action={entry.action} value={entry.from} />
                          {" → "}
                          <AuditValue action={entry.action} value={entry.to} />
                          {entry.targetEmail && <small className="cr-audit-target cr-break">{entry.targetEmail}</small>}
                        </span>
                      </td>
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
