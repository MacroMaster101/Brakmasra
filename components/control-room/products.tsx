"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PackagePlus, Plus, Shirt } from "lucide-react";

import { importStarterProductsAction } from "@/app/admin/store-actions";
import { ActionStatus, EmptyState, SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { idleState, Notice } from "@/components/control-room/store-shared";
import { useLanguage } from "@/components/language-provider";
import { formatMoney } from "@/lib/cart";
import type { SectionData } from "@/lib/control-room-validation";
import { formatDate, type TextKey } from "@/lib/i18n";
import type { AdminProductSummary } from "@/lib/store-admin";
import type { ProductStatus } from "@/lib/store-admin-validation";

export const productStatusLabels: Record<ProductStatus, TextKey> = {
  draft: "crsStatusDraft",
  active: "crsStatusActive",
  archived: "crsStatusArchived",
};

function ImportStarter() {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(importStarterProductsAction, idleState);
  return (
    <form className="crs-import" action={formAction}>
      <p>{t.crsImportDesc}</p>
      <button className="button button-secondary" type="submit" disabled={pending}>
        <PackagePlus aria-hidden="true" />
        {pending ? t.crSaving : t.crsImport}
      </button>
      <ActionStatus state={state} />
    </form>
  );
}

export function ControlRoomProducts({ products, canManage, notice }: {
  products: SectionData<AdminProductSummary[]>;
  canManage: boolean;
  notice: TextKey | null;
}) {
  const { t, lang } = useLanguage();

  return (
    <SectionPanel
      id="crs-products-title"
      title="crsProductsTitle"
      desc="crsProductsDesc"
      actions={canManage ? (
        <Link className="button button-primary" href="/admin/products/new">
          <Plus aria-hidden="true" />
          {t.crsNewProduct}
        </Link>
      ) : null}
    >
      <Notice text={notice} />
      <SectionGate data={products}>
        {(list) => (list.length === 0
          ? (
            <>
              <EmptyState icon={Shirt} title="crsProductsEmpty" desc="crsProductsEmptyDesc" />
              {canManage && <ImportStarter />}
            </>
          )
          : (
            <table className="cr-table crs-products">
              <thead>
                <tr>
                  <th scope="col">{t.crsProduct}</th>
                  <th scope="col">{t.crStatus}</th>
                  <th scope="col">{t.crsStock}</th>
                  <th scope="col">{t.crsUpdated}</th>
                  <th scope="col" className="is-end">{t.crsPrice}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((product) => (
                  <tr key={product.id}>
                    <td data-label={t.crsProduct}>
                      <Link className="crs-product-link" href={`/admin/products/${product.id}`}>
                        <span className="crs-thumb" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element -- stored WebP or a local file; list thumbnails skip the optimizer. */}
                          {product.image && <img src={product.image} alt="" loading="lazy" decoding="async" />}
                        </span>
                        <span>
                          <strong>{product.name}</strong>
                          <small className="cr-mono">/shop/{product.slug}</small>
                        </span>
                      </Link>
                    </td>
                    <td data-label={t.crStatus}>
                      <span className="crs-pills">
                        <StatusPill tone={product.status}>{t[productStatusLabels[product.status]]}</StatusPill>
                        {product.comingSoon && <StatusPill tone="pending">{t.crsComingSoon}</StatusPill>}
                      </span>
                    </td>
                    <td data-label={t.crsStock} className={product.stock === 0 ? "crs-out" : undefined}>
                      {product.stock === 0 ? t.crsOutOfStock : product.stock}
                    </td>
                    <td data-label={t.crsUpdated}>
                      {product.updatedAt && <time dateTime={product.updatedAt}>{formatDate(product.updatedAt, lang)}</time>}
                    </td>
                    <td data-label={t.crsPrice} className="is-end">
                      <strong>{formatMoney(product.priceMinor, product.currency)}</strong>
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
