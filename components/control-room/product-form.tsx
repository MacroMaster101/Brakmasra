"use client";

import { useMemo, useState } from "react";

import { deleteProductAction, saveProductAction } from "@/app/admin/store-actions";
import { productStatusLabels } from "@/components/control-room/products";
import { DeleteForm, Field, SaveBar, Toggle, useCrForm } from "@/components/control-room/store-shared";
import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";
import type { AdminProduct } from "@/lib/store-admin";
import {
  formatMoneyInput,
  parseList,
  PRODUCT_BADGES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  slugify,
  stockField,
  variantCombos,
} from "@/lib/store-admin-validation";

const categoryLabels: Record<(typeof PRODUCT_CATEGORIES)[number], TextKey> = {
  Apparel: "shopFilterApparel",
  Headwear: "shopFilterHeadwear",
};

const badgeLabels: Record<(typeof PRODUCT_BADGES)[number], TextKey> = {
  NEW: "shopBadgeNew",
  LIMITED: "shopBadgeLimited",
  "BEST SELLER": "shopBadgeBestSeller",
  SALE: "shopBadgeSale",
};

export function ProductForm({ product, canManage }: { product: AdminProduct | null; canManage: boolean }) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useCrForm(saveProductAction);

  const activeVariants = (product?.variants ?? []).filter((variant) => variant.active);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [sizes, setSizes] = useState(() => [...new Set(activeVariants.map((variant) => variant.size).filter(Boolean))].join(", "));
  const [colors, setColors] = useState(() => [...new Set(activeVariants.map((variant) => variant.color).filter(Boolean))].join(", "));
  const [stock, setStock] = useState<Record<string, string>>(() =>
    Object.fromEntries(activeVariants.map((variant) => [stockField(variant.size, variant.color), String(variant.inventory)])),
  );

  const sizeList = useMemo(() => parseList(sizes), [sizes]);
  const colorList = useMemo(() => parseList(colors), [colors]);
  const combos = variantCombos(sizeList, colorList);
  const totalStock = combos.reduce((total, combo) => total + (Number(stock[stockField(combo.size, combo.color)]) || 0), 0);

  return (
    <>
      <form className="crs-form" action={formAction} onSubmit={onSubmit}>
        {product && <input type="hidden" name="id" value={product.id} />}
        <fieldset className="crs-fieldset" disabled={!canManage}>
          <legend>{t.crsBasics}</legend>
          <div className="crs-grid">
            <Field label="crsName" wide>
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugEdited) setSlug(slugify(event.target.value));
                }}
              />
            </Field>
            <Field label="crsSlug" hint="crsSlugHint">
              <input
                name="slug"
                required
                maxLength={80}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(event.target.value.toLowerCase());
                }}
              />
            </Field>
            <Field label="crsPriceLkr" hint="crsPriceHint">
              <input
                name="price"
                required
                inputMode="decimal"
                pattern="[0-9,]{1,9}(\.[0-9]{1,2})?"
                defaultValue={product ? formatMoneyInput(product.priceMinor) : ""}
              />
            </Field>
            <Field label="crStatus" hint="crsStatusHint">
              <select name="status" defaultValue={product?.status ?? "draft"}>
                {PRODUCT_STATUSES.map((value) => <option key={value} value={value}>{t[productStatusLabels[value]]}</option>)}
              </select>
            </Field>
            <Field label="crsCategory">
              <select name="category" defaultValue={product?.category ?? ""}>
                <option value="">{t.crsNone}</option>
                {PRODUCT_CATEGORIES.map((value) => <option key={value} value={value}>{t[categoryLabels[value]]}</option>)}
              </select>
            </Field>
            <Field label="crsBadge">
              <select name="badge" defaultValue={product?.badge ?? ""}>
                <option value="">{t.crsNone}</option>
                {PRODUCT_BADGES.map((value) => <option key={value} value={value}>{t[badgeLabels[value]]}</option>)}
              </select>
            </Field>
            <Field label="crsPosition" hint="crsPositionHint">
              <input name="position" type="number" min={0} max={9999} step={1} defaultValue={product?.position ?? 0} />
            </Field>
          </div>
          <Toggle name="comingSoon" label="crsComingSoon" hint="crsComingSoonHint" defaultChecked={product?.comingSoon ?? false} />
        </fieldset>

        <fieldset className="crs-fieldset" disabled={!canManage}>
          <legend>{t.crsDetails}</legend>
          <div className="crs-grid">
            <Field label="crsDescription" wide>
              <textarea name="description" required minLength={10} maxLength={2000} rows={4} defaultValue={product?.description ?? ""} />
            </Field>
            <Field label="crsFabric">
              <input name="fabric" maxLength={200} defaultValue={product?.fabric ?? ""} />
            </Field>
            <Field label="crsCare" hint="crsOnePerLine">
              <textarea name="care" rows={3} maxLength={1000} defaultValue={product?.care.join("\n") ?? ""} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="crs-fieldset" disabled={!canManage}>
          <legend>{t.crsSinhala}</legend>
          <p className="crs-legend-note">{t.crsSinhalaHint}</p>
          <div className="crs-grid" lang="si">
            <Field label="crsDescription" wide>
              <textarea name="siDescription" maxLength={2000} rows={4} defaultValue={product?.siDescription ?? ""} />
            </Field>
            <Field label="crsFabric">
              <input name="siFabric" maxLength={200} defaultValue={product?.siFabric ?? ""} />
            </Field>
            <Field label="crsCare" hint="crsOnePerLine">
              <textarea name="siCare" rows={3} maxLength={1400} defaultValue={product?.siCare.join("\n") ?? ""} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="crs-fieldset" disabled={!canManage}>
          <legend>{t.crsStockTitle}</legend>
          <div className="crs-grid">
            <Field label="crsSizes" hint="crsSizesHint">
              <input name="sizes" maxLength={400} value={sizes} onChange={(event) => setSizes(event.target.value)} placeholder="S, M, L, XL" />
            </Field>
            <Field label="crsColors" hint="crsColorsHint">
              <input name="colors" maxLength={600} value={colors} onChange={(event) => setColors(event.target.value)} placeholder="Washed black" />
            </Field>
          </div>
          <div className="crs-stock" role="group" aria-label={t.crsStockTitle}>
            {combos.map(({ size, color }) => {
              const field = stockField(size, color);
              const label = [size, color].filter(Boolean).join(" · ") || t.crsOneSize;
              return (
                <label key={field} className="crs-stock-cell">
                  <span>{label}</span>
                  <input
                    name={field}
                    type="number"
                    min={0}
                    max={100000}
                    step={1}
                    inputMode="numeric"
                    value={stock[field] ?? "0"}
                    onChange={(event) => setStock((current) => ({ ...current, [field]: event.target.value }))}
                  />
                </label>
              );
            })}
          </div>
          <p className="crs-legend-note">{t.crsStockTotal(totalStock)}</p>
        </fieldset>

        <SaveBar pending={pending} state={state} canManage={canManage} label={product ? "crSave" : "crsCreateProduct"} />
      </form>

      {product && canManage && (
        <section className="crs-danger" aria-labelledby="crs-delete-product">
          <div>
            <h3 id="crs-delete-product">{t.crsDeleteProduct}</h3>
            <p>{t.crsDeleteProductDesc}</p>
          </div>
          <DeleteForm action={deleteProductAction} id={product.id} confirm="crsDeleteProductConfirm" />
        </section>
      )}
    </>
  );
}
