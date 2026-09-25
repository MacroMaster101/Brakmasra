"use client";

import { updateOrderAction } from "@/app/admin/store-actions";
import { orderStatusLabels } from "@/components/control-room/orders";
import { SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { BackLink, Field, SaveBar, useCrForm } from "@/components/control-room/store-shared";
import { useLanguage } from "@/components/language-provider";
import { formatMoney } from "@/lib/cart";
import type { SectionData } from "@/lib/control-room-validation";
import { formatDate } from "@/lib/i18n";
import { ORDER_STATUS_VALUES } from "@/lib/order-status";
import type { AdminOrderDetail } from "@/lib/store-admin";

function OrderManageForm({ order, canManage }: { order: AdminOrderDetail; canManage: boolean }) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useCrForm(updateOrderAction);
  return (
    <form className="crs-form" action={formAction} onSubmit={onSubmit}>
      <input type="hidden" name="publicId" value={order.publicId} />
      <fieldset className="crs-fieldset" disabled={!canManage}>
        <legend>{t.crsFulfilment}</legend>
        <div className="crs-grid">
          <Field label="crStatus" hint="crsOrderStatusHint">
            <select name="status" defaultValue={order.status}>
              {ORDER_STATUS_VALUES.map((value) => <option key={value} value={value}>{t[orderStatusLabels[value]]}</option>)}
            </select>
          </Field>
          <Field label="crsTracking" hint="crsTrackingHint">
            <input name="trackingNumber" maxLength={100} defaultValue={order.trackingNumber} />
          </Field>
          <Field label="crsAdminNote" hint="crsAdminNoteHint" wide>
            <textarea name="adminNote" maxLength={1000} rows={3} defaultValue={order.adminNote} />
          </Field>
        </div>
      </fieldset>
      <SaveBar pending={pending} state={state} canManage={canManage} />
    </form>
  );
}

export function ControlRoomOrderDetail({ data, canManage }: { data: SectionData<AdminOrderDetail>; canManage: boolean }) {
  const { t, lang } = useLanguage();
  return (
    <>
      <BackLink href="/admin/orders" label="crsBackToOrders" />
      <SectionGate data={data}>
        {(order) => (
          <>
            <SectionPanel
              id="crs-order-title"
              title="crsOrderTitle"
              desc="crsOrderDesc"
              actions={<StatusPill tone={order.status}>{t[orderStatusLabels[order.status]]}</StatusPill>}
            >
              <dl className="crs-facts">
                <div><dt>{t.accountOrderNumber}</dt><dd className="cr-mono">{order.publicId}</dd></div>
                <div><dt>{t.accountOrderPlaced}</dt><dd><time dateTime={order.createdAt}>{formatDate(order.createdAt, lang)}</time></dd></div>
                <div>
                  <dt>{t.crCustomer}</dt>
                  <dd className="cr-break"><a href={`mailto:${encodeURIComponent(order.customerEmail)}`}>{order.customerEmail}</a></dd>
                </div>
                {order.paymentProvider && <div><dt>{t.crsPayment}</dt><dd>{order.paymentProvider}</dd></div>}
              </dl>

              <h3 className="crs-subheading">{t.crsItems}</h3>
              {order.items.length === 0
                ? <p className="crs-legend-note">{t.crsNoItems}</p>
                : (
                  <table className="cr-table">
                    <thead>
                      <tr>
                        <th scope="col">{t.crsProduct}</th>
                        <th scope="col">{t.crsQuantity}</th>
                        <th scope="col" className="is-end">{t.crsPrice}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td data-label={t.crsProduct}>
                            <strong>{item.productName}</strong>
                            {item.variantLabel && <small className="crs-block">{item.variantLabel}</small>}
                          </td>
                          <td data-label={t.crsQuantity}>× {item.quantity}</td>
                          <td data-label={t.crsPrice} className="is-end">{formatMoney(item.unitPriceMinor * item.quantity, order.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              <dl className="crs-totals">
                <div><dt>{t.crsSubtotal}</dt><dd>{formatMoney(order.subtotalMinor, order.currency)}</dd></div>
                <div><dt>{t.crsShipping}</dt><dd>{formatMoney(order.shippingMinor, order.currency)}</dd></div>
                {order.taxMinor > 0 && <div><dt>{t.crsTax}</dt><dd>{formatMoney(order.taxMinor, order.currency)}</dd></div>}
                <div className="is-total"><dt>{t.accountOrderTotal}</dt><dd>{formatMoney(order.totalMinor, order.currency)}</dd></div>
              </dl>

              <h3 className="crs-subheading">{t.crsShippingAddress}</h3>
              {order.shippingAddress.length === 0
                ? <p className="crs-legend-note">{t.crsNoAddress}</p>
                : (
                  <dl className="crs-facts">
                    {order.shippingAddress.map((line) => (
                      <div key={line.label}><dt className="cr-mono">{line.label.replace(/_/g, " ")}</dt><dd className="cr-break">{line.value}</dd></div>
                    ))}
                  </dl>
                )}
            </SectionPanel>

            <SectionPanel id="crs-order-manage" title="crsFulfilment" desc={canManage ? "crsFulfilmentDesc" : "crsFulfilmentViewDesc"}>
              <OrderManageForm key={`${order.status}:${order.trackingNumber}:${order.adminNote}`} order={order} canManage={canManage} />
            </SectionPanel>
          </>
        )}
      </SectionGate>
    </>
  );
}
