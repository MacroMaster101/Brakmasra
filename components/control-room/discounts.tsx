"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, TicketPercent } from "lucide-react";

import { deleteDiscountAction, saveDiscountAction } from "@/app/admin/store-actions";
import { EmptyState, SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { BackLink, DeleteForm, Field, Notice, SaveBar, Toggle, useCrForm } from "@/components/control-room/store-shared";
import { useLanguage } from "@/components/language-provider";
import { formatMoney } from "@/lib/cart";
import type { SectionData } from "@/lib/control-room-validation";
import { formatDate, type Language, type TextKey } from "@/lib/i18n";
import type { AdminDiscount } from "@/lib/store-admin";
import { formatMoneyInput, isoToLocalDateTime, type DiscountKind } from "@/lib/store-admin-validation";

type DiscountState = "live" | "scheduled" | "ended" | "off";

function discountState(discount: AdminDiscount, now = Date.now()): DiscountState {
  if (!discount.active) return "off";
  if (discount.startsAt && Date.parse(discount.startsAt) > now) return "scheduled";
  if (discount.endsAt && Date.parse(discount.endsAt) <= now) return "ended";
  return "live";
}

const stateLabels: Record<DiscountState, { label: TextKey; tone: string }> = {
  live: { label: "crsDiscountLive", tone: "active" },
  scheduled: { label: "crsDiscountScheduled", tone: "pending" },
  ended: { label: "crsDiscountEnded", tone: "archived" },
  off: { label: "crsDiscountOff", tone: "draft" },
};

function discountValue(discount: AdminDiscount) {
  return discount.kind === "percent" ? `${discount.value}%` : formatMoney(discount.value, "LKR");
}

function dateRange(discount: AdminDiscount, lang: Language, always: string) {
  if (!discount.startsAt && !discount.endsAt) return always;
  const from = discount.startsAt ? formatDate(discount.startsAt, lang) : "…";
  const to = discount.endsAt ? formatDate(discount.endsAt, lang) : "…";
  return `${from} – ${to}`;
}

export function ControlRoomDiscounts({ discounts, canManage, notice }: {
  discounts: SectionData<AdminDiscount[]>;
  canManage: boolean;
  notice: TextKey | null;
}) {
  const { t, lang } = useLanguage();
  // Read once per render; the list is rendered on the server's request anyway.
  const [now] = useState(() => Date.now());

  return (
    <SectionPanel
      id="crs-discounts-title"
      title="crsDiscountsTitle"
      desc="crsDiscountsDesc"
      actions={canManage ? (
        <Link className="button button-primary" href="/admin/discounts/new">
          <Plus aria-hidden="true" />
          {t.crsNewDiscount}
        </Link>
      ) : null}
    >
      <Notice text={notice} />
      <SectionGate data={discounts}>
        {(list) => (list.length === 0
          ? <EmptyState icon={TicketPercent} title="crsDiscountsEmpty" desc="crsDiscountsEmptyDesc" />
          : (
            <table className="cr-table">
              <thead>
                <tr>
                  <th scope="col">{t.crsCode}</th>
                  <th scope="col">{t.crStatus}</th>
                  <th scope="col">{t.crsDates}</th>
                  <th scope="col">{t.crsUsageLimit}</th>
                  <th scope="col" className="is-end">{t.crsDiscountValue}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((discount) => {
                  const state = stateLabels[discountState(discount, now)];
                  return (
                    <tr key={discount.id}>
                      <td data-label={t.crsCode}>
                        <Link className="crs-row-link cr-mono" href={`/admin/discounts/${discount.id}`}>
                          <strong>{discount.code}</strong>
                        </Link>
                      </td>
                      <td data-label={t.crStatus}><StatusPill tone={state.tone}>{t[state.label]}</StatusPill></td>
                      <td data-label={t.crsDates}>{dateRange(discount, lang, t.crsAlways)}</td>
                      <td data-label={t.crsUsageLimit}>{discount.usageLimit ?? t.crsUnlimited}</td>
                      <td data-label={t.crsDiscountValue} className="is-end"><strong>{discountValue(discount)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ))}
      </SectionGate>
    </SectionPanel>
  );
}

function DiscountForm({ discount, canManage }: { discount: AdminDiscount | null; canManage: boolean }) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useCrForm(saveDiscountAction);
  const [kind, setKind] = useState<DiscountKind>(discount?.kind ?? "percent");
  const initialValue = discount ? (discount.kind === "percent" ? String(discount.value) : formatMoneyInput(discount.value)) : "";

  return (
    <form className="crs-form" action={formAction} onSubmit={onSubmit}>
      {discount && <input type="hidden" name="id" value={discount.id} />}
      <fieldset className="crs-fieldset" disabled={!canManage}>
        <legend>{t.crsDiscountDetails}</legend>
        <div className="crs-grid">
          <Field label="crsCode" hint="crsCodeHint">
            <input
              name="code"
              required
              minLength={3}
              maxLength={32}
              pattern="[A-Za-z0-9_\-]{3,32}"
              autoCapitalize="characters"
              className="cr-mono"
              defaultValue={discount?.code ?? ""}
            />
          </Field>
          <Field label="crsDiscountKind">
            <select name="kind" value={kind} onChange={(event) => setKind(event.target.value as DiscountKind)}>
              <option value="percent">{t.crsKindPercent}</option>
              <option value="fixed">{t.crsKindFixed}</option>
            </select>
          </Field>
          <Field label={kind === "percent" ? "crsPercentOff" : "crsAmountOff"} hint={kind === "percent" ? "crsPercentHint" : "crsAmountHint"}>
            <input key={kind} name="value" required inputMode="decimal" defaultValue={kind === discount?.kind ? initialValue : ""} />
          </Field>
          <Field label="crsUsageLimit" hint="crsUsageLimitHint">
            <input name="usageLimit" type="number" min={1} max={1000000} step={1} defaultValue={discount?.usageLimit ?? ""} />
          </Field>
          <Field label="crsStartsAt" hint="crsDateHint">
            <input name="startsAt" type="datetime-local" defaultValue={isoToLocalDateTime(discount?.startsAt ?? null)} />
          </Field>
          <Field label="crsEndsAt" hint="crsDateHint">
            <input name="endsAt" type="datetime-local" defaultValue={isoToLocalDateTime(discount?.endsAt ?? null)} />
          </Field>
        </div>
        <Toggle name="active" label="crsDiscountActive" hint="crsDiscountActiveHint" defaultChecked={discount?.active ?? false} />
      </fieldset>
      <SaveBar pending={pending} state={state} canManage={canManage} label={discount ? "crSave" : "crsCreateDiscount"} />
    </form>
  );
}

export function DiscountEditor({ data, canManage }: { data: SectionData<AdminDiscount | null>; canManage: boolean }) {
  const { t } = useLanguage();
  return (
    <>
      <BackLink href="/admin/discounts" label="crsBackToDiscounts" />
      <SectionGate data={data}>
        {(discount) => (
          <SectionPanel
            id="crs-discount-title"
            title={discount ? (canManage ? "crsEditDiscount" : "crsViewDiscount") : "crsNewDiscount"}
            desc="crsDiscountFormDesc"
          >
            <DiscountForm key={discount ? JSON.stringify(discount) : "new"} discount={discount} canManage={canManage} />
            {discount && canManage && (
              <section className="crs-danger" aria-labelledby="crs-delete-discount">
                <div>
                  <h3 id="crs-delete-discount">{t.crsDeleteDiscount}</h3>
                  <p>{t.crsDeleteDiscountDesc}</p>
                </div>
                <DeleteForm action={deleteDiscountAction} id={discount.id} confirm="crsDeleteDiscountConfirm" />
              </section>
            )}
          </SectionPanel>
        )}
      </SectionGate>
    </>
  );
}
