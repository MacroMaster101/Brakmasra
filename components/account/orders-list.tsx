"use client";

import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { formatMoney } from "@/lib/cart";
import { formatDate, type TextKey } from "@/lib/i18n";
import type { MemberOrder, OrderStatus } from "@/lib/orders";

const statusLabels: Record<OrderStatus, TextKey> = {
  pending: "accountOrderStatusPending",
  paid: "accountOrderStatusPaid",
  fulfilled: "accountOrderStatusFulfilled",
  cancelled: "accountOrderStatusCancelled",
  refunded: "accountOrderStatusRefunded",
};

export function OrdersList({ orders }: { orders: MemberOrder[] }) {
  const { t, lang } = useLanguage();

  if (orders.length === 0) {
    return (
      <section className="account-orders account-orders-empty">
        <PackageOpen aria-hidden="true" />
        <h2>{t.accountNoOrders}</h2>
        <p>{t.accountNoOrdersDesc}</p>
        <Link className="button button-primary" href="/shop">{t.homeExploreBtn} <ArrowRight aria-hidden="true" /></Link>
      </section>
    );
  }

  return (
    <section className="panel account-panel" aria-labelledby="account-orders-title">
      <header className="account-panel-heading">
        <h2 id="account-orders-title">{t.accountOrdersTitle}</h2>
        <p>{t.accountOrdersDesc}</p>
      </header>

      <ol className="account-order-list">
        {orders.map((order) => (
          <li key={order.publicId} className="account-order">
            <div className="account-order-id">
              <span>{t.accountOrderNumber}</span>
              <strong>{order.publicId}</strong>
            </div>
            <div>
              <span>{t.accountOrderPlaced}</span>
              <time dateTime={order.createdAt}>{formatDate(order.createdAt, lang)}</time>
            </div>
            <div>
              <span>{t.accountOrderStatus}</span>
              <em className={`account-order-status is-${order.status}`}>{t[statusLabels[order.status]]}</em>
            </div>
            <div className="account-order-total">
              <span>{t.accountOrderTotal}</span>
              <strong>{formatMoney(order.totalMinor, order.currency)}</strong>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
