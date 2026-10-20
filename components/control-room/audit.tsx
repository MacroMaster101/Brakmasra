"use client";

import { messageStatusLabels } from "@/components/control-room/messages";
import { orderStatusLabels } from "@/components/control-room/orders";
import { useLanguage } from "@/components/language-provider";
import { roleLabelKey } from "@/components/role-badge";
import type { AuditEntry } from "@/lib/control-room";
import { MESSAGE_STATUSES, type MessageStatus } from "@/lib/control-room-validation";
import type { TextKey } from "@/lib/i18n";
import { ORDER_STATUS_VALUES, type OrderStatusValue } from "@/lib/order-status";
import { parseRole } from "@/lib/roles";

/** Plain-language names for every action the Control Room logs. */
const auditActions: Record<string, TextKey> = {
  "role.change": "crAuditRoleChange",
  "message.status": "crAuditMessageStatus",
  "message.delete": "crAuditMessageDelete",
  "subscriber.delete": "crAuditSubscriberDelete",
  "subscriber.export": "crAuditSubscriberExport",
  "product.create": "crAuditProductCreate",
  "product.update": "crAuditProductUpdate",
  "product.delete": "crAuditProductDelete",
  "product.import": "crAuditProductImport",
  "product.photo.add": "crAuditPhotoAdd",
  "product.photo.delete": "crAuditPhotoDelete",
  "product.photo.move": "crAuditPhotoMove",
  "product.photo.description": "crAuditPhotoDescription",
  "collection.create": "crAuditCollectionCreate",
  "collection.update": "crAuditCollectionUpdate",
  "collection.delete": "crAuditCollectionDelete",
  "discount.create": "crAuditDiscountCreate",
  "discount.update": "crAuditDiscountUpdate",
  "discount.delete": "crAuditDiscountDelete",
  "order.update": "crAuditOrderUpdate",
  "content.draft": "crAuditContentDraft",
  "content.publish": "crAuditContentPublish",
  "content.unpublish": "crAuditContentUnpublish",
  "content.delete": "crAuditContentDelete",
  "content.restore": "crAuditContentRestore",
  "content.reset": "crAuditContentReset",
};

export function AuditAction({ action }: { action: string }) {
  const { t } = useLanguage();
  return Object.hasOwn(auditActions, action)
    ? <span>{t[auditActions[action]]}</span>
    : <span className="cr-mono">{action}</span>;
}

function AuditValue({ action, value }: { action: string; value: string | null }) {
  const { t } = useLanguage();
  if (action === "role.change") {
    const role = parseRole(value);
    return <>{role ? t[roleLabelKey(role)] : t.crRoleNone}</>;
  }
  if (action === "message.status" && (MESSAGE_STATUSES as readonly string[]).includes(value ?? "")) {
    return <>{t[messageStatusLabels[value as MessageStatus]]}</>;
  }
  if (action === "order.update" && (ORDER_STATUS_VALUES as readonly string[]).includes(value ?? "")) {
    return <>{t[orderStatusLabels[value as OrderStatusValue]]}</>;
  }
  return <>{value ?? "–"}</>;
}

/** Whether a log entry has anything to show beyond its action. */
export function hasAuditDetail(entry: AuditEntry) {
  return entry.from !== null || entry.to !== null || entry.subject !== null || entry.targetEmail !== null;
}

// Content keys are stored as "cms:page:home"; people know them as "home".
function subjectLabel(subject: string) {
  return subject.replace(/^cms:(?:page|post):/, "");
}

/** "Old → New" for status and role changes, otherwise what was edited, such as a product slug. */
export function AuditChange({ entry }: { entry: AuditEntry }) {
  if (entry.from === null && entry.to === null) {
    return (
      <span>
        {entry.subject ? <span className="cr-mono">{subjectLabel(entry.subject)}</span> : "–"}
        {entry.targetEmail && <small className="cr-audit-target cr-break">{entry.targetEmail}</small>}
      </span>
    );
  }
  return (
    <span>
      <AuditValue action={entry.action} value={entry.from} />
      {" → "}
      <AuditValue action={entry.action} value={entry.to} />
      {entry.targetEmail && <small className="cr-audit-target cr-break">{entry.targetEmail}</small>}
    </span>
  );
}
