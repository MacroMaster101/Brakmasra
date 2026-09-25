"use client";

import { PackageOpen } from "lucide-react";

import { EmptyState, SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { useLanguage } from "@/components/language-provider";
import { formatMoney } from "@/lib/cart";
import type { AdminOrder } from "@/lib/control-room";
import type { SectionData } from "@/lib/control-room-validation";
import { formatDate, type TextKey } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders";

const statusLabels: Record<OrderStatus, TextKey> = {
  pending: "accountOrderStatusPending",
  paid: "accountOrderStatusPaid",
  fulfilled: "accountOrderStatusFulfilled",
  cancelled: "accountOrderStatusCancelled",
  refunded: "accountOrderStatusRefunded",
};

export function ControlRoomOrders({ orders }: { orders: SectionData<AdminOrder[]> }) {
  const { t, lang } = useLanguage();

  return (
    <SectionPanel id="cr-orders-title" title="crOrdersTitle" desc="crOrdersDesc">
      <SectionGate data={orders}>
        {(list) => (list.length === 0
          ? <EmptyState icon={PackageOpen} title="crOrdersEmpty" desc="crOrdersEmptyDesc" />
          : (
            <table className="cr-table">
              <thead>
                <tr>
                  <th scope="col">{t.accountOrderNumber}</th>
                  <th scope="col">{t.crCustomer}</th>
                  <th scope="col">{t.accountOrderPlaced}</th>
                  <th scope="col">{t.accountOrderStatus}</th>
                  <th scope="col" className="is-end">{t.accountOrderTotal}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((order) => (
                  <tr key={order.publicId}>
                    <td data-label={t.accountOrderNumber} className="cr-mono">{order.publicId}</td>
                    <td data-label={t.crCustomer}>
                      <a href={`mailto:${encodeURIComponent(order.customerEmail)}`}>{order.customerEmail}</a>
                    </td>
                    <td data-label={t.accountOrderPlaced}>
                      <time dateTime={order.createdAt}>{formatDate(order.createdAt, lang)}</time>
                    </td>
                    <td data-label={t.accountOrderStatus}>
                      <StatusPill tone={order.status}>{t[statusLabels[order.status]]}</StatusPill>
                    </td>
                    <td data-label={t.accountOrderTotal} className="is-end">
                      <strong>{formatMoney(order.totalMinor, order.currency)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </SectionGate>
    </SectionPanel>
  );
}
