"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Inbox } from "lucide-react";

import { updateMessageStatusAction, type ControlRoomActionState } from "@/app/admin/actions";
import { ActionStatus, EmptyState, SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { useLanguage } from "@/components/language-provider";
import { contactTopics, type ContactTopic } from "@/lib/contact-topics";
import type { ContactMessage } from "@/lib/control-room";
import { MESSAGE_STATUSES, type MessageFilter, type MessageStatus, type SectionData } from "@/lib/control-room-validation";
import { formatDate, type TextKey } from "@/lib/i18n";

export const messageStatusLabels: Record<MessageStatus, TextKey> = {
  new: "crMsgStatusNew",
  read: "crMsgStatusRead",
  resolved: "crMsgStatusResolved",
  spam: "crMsgStatusSpam",
};

// Stored topics are the English values the contact API accepts.
const topicLabels: Record<ContactTopic, TextKey> = {
  "General inquiry": "contactTopicGeneral",
  "Order support": "contactTopicOrders",
  "Business inquiry": "contactTopicBiz",
};

const PREVIEW_LENGTH = 180;
const idleState: ControlRoomActionState = { status: "idle", message: "" };

function StatusFilter({ current }: { current: MessageFilter }) {
  const { t } = useLanguage();
  const filters: { value: MessageFilter; label: TextKey }[] = [
    { value: "all", label: "crFilterAll" },
    ...MESSAGE_STATUSES.map((status) => ({ value: status, label: messageStatusLabels[status] })),
  ];

  return (
    <nav className="cr-filter" aria-label={t.crFilterLabel}>
      {filters.map(({ value, label }) => (
        <Link
          key={value}
          href={value === "all" ? "/admin/messages" : `/admin/messages?status=${value}`}
          aria-current={value === current ? "page" : undefined}
          scroll={false}
        >
          {t[label]}
        </Link>
      ))}
    </nav>
  );
}

function MessageBody({ message }: { message: string }) {
  const { t } = useLanguage();
  if (message.length <= PREVIEW_LENGTH) return <p className="cr-message-text">{message}</p>;

  return (
    <details className="cr-message-details">
      <summary>
        <span className="cr-message-preview">{message.slice(0, PREVIEW_LENGTH).trimEnd()}…</span>
        <span className="cr-message-toggle">
          <span className="cr-when-closed">{t.crShowFull}</span>
          <span className="cr-when-open">{t.crHideFull}</span>
        </span>
      </summary>
      <p className="cr-message-text">{message}</p>
    </details>
  );
}

function MessageStatusForm({ id, status }: { id: string; status: MessageStatus }) {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(updateMessageStatusAction, idleState);

  return (
    <form className="cr-inline-form" action={formAction}>
      <input type="hidden" name="id" value={id} />
      <label>
        <span>{t.crSetStatus}</span>
        {/* Remounts when the saved status changes, so the form reset never shows a stale value. */}
        <select key={status} name="status" defaultValue={status}>
          {MESSAGE_STATUSES.map((value) => <option key={value} value={value}>{t[messageStatusLabels[value]]}</option>)}
        </select>
      </label>
      <button className="button button-secondary" type="submit" disabled={pending}>
        {pending ? t.crSaving : t.crSaveStatus}
      </button>
      <ActionStatus state={state} />
    </form>
  );
}

export function ControlRoomMessages({ filter, messages }: { filter: MessageFilter; messages: SectionData<ContactMessage[]> }) {
  const { t, lang } = useLanguage();

  return (
    <SectionPanel id="cr-messages-title" title="crMessagesTitle" desc="crMessagesDesc">
      <StatusFilter current={filter} />
      <SectionGate data={messages}>
        {(list) => (list.length === 0
          ? <EmptyState icon={Inbox} title="crMessagesEmpty" desc="crMessagesEmptyDesc" />
          : (
            <ol className="cr-messages">
              {list.map((message) => {
                const topic = (contactTopics as readonly string[]).includes(message.topic)
                  ? t[topicLabels[message.topic as ContactTopic]]
                  : message.topic;
                return (
                  <li key={message.id} className={`cr-message is-${message.status}`}>
                    <header className="cr-message-head">
                      <div className="cr-message-from">
                        <strong>{message.name}</strong>
                        <a href={`mailto:${encodeURIComponent(message.email)}`}>{message.email}</a>
                      </div>
                      <StatusPill tone={message.status}>{t[messageStatusLabels[message.status]]}</StatusPill>
                    </header>
                    <dl className="cr-message-meta">
                      <div>
                        <dt>{t.crTopic}</dt>
                        <dd>{topic}</dd>
                      </div>
                      <div>
                        <dt>{t.crReceived}</dt>
                        <dd><time dateTime={message.createdAt}>{formatDate(message.createdAt, lang)}</time></dd>
                      </div>
                    </dl>
                    <MessageBody message={message.message} />
                    <MessageStatusForm id={message.id} status={message.status} />
                  </li>
                );
              })}
            </ol>
          ))}
      </SectionGate>
    </SectionPanel>
  );
}
