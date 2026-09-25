"use client";

import { MailX } from "lucide-react";

import { EmptyState, SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { useLanguage } from "@/components/language-provider";
import type { Subscriber, SubscriberCounts } from "@/lib/control-room";
import { SUBSCRIBER_STATUSES, type SectionData, type SubscriberStatus } from "@/lib/control-room-validation";
import { formatDate, type TextKey } from "@/lib/i18n";

const statusLabels: Record<SubscriberStatus, TextKey> = {
  pending: "crSubStatusPending",
  active: "crSubStatusActive",
  unsubscribed: "crSubStatusUnsubscribed",
};

export type SubscribersData = { subscribers: Subscriber[]; counts: SubscriberCounts | null };

export function ControlRoomSubscribers({ data }: { data: SectionData<SubscribersData> }) {
  const { t, lang } = useLanguage();

  return (
    <SectionPanel id="cr-subscribers-title" title="crSubscribersTitle" desc="crSubscribersDesc">
      <SectionGate data={data}>
        {({ subscribers, counts }) => (
          <>
            {counts && (
              <ul className="cr-counts">
                {SUBSCRIBER_STATUSES.map((status) => (
                  <li key={status} className={`is-${status}`}>
                    <strong>{counts[status]}</strong>
                    <span>{t[statusLabels[status]]}</span>
                  </li>
                ))}
              </ul>
            )}
            {subscribers.length === 0
              ? <EmptyState icon={MailX} title="crSubscribersEmpty" desc="crSubscribersEmptyDesc" />
              : (
                <table className="cr-table">
                  <thead>
                    <tr>
                      <th scope="col">{t.accountEmail}</th>
                      <th scope="col">{t.crStatus}</th>
                      <th scope="col">{t.crConsented}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id}>
                        <td data-label={t.accountEmail} className="cr-break">{subscriber.email}</td>
                        <td data-label={t.crStatus}>
                          <StatusPill tone={subscriber.status}>{t[statusLabels[subscriber.status]]}</StatusPill>
                        </td>
                        <td data-label={t.crConsented}>
                          <time dateTime={subscriber.consentedAt}>{formatDate(subscriber.consentedAt, lang)}</time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </>
        )}
      </SectionGate>
    </SectionPanel>
  );
}
