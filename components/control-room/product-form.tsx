"use client";
import { editorChanged } from "@/components/control-room/editor-dialog";
import { ProductAddressField } from "@/components/control-room/product-address-field";
import { RoundedSelect } from "@/components/control-room/rounded-select";

import { formatMoney } from "@/lib/cart";
import { convertCurrencyMinor, parseCurrency, type StoreCurrency } from "@/lib/currency";
import { useCurrency } from "@/components/currency-provider";
import { alternateSalePrice, salePriceMinor, type SaleDiscountKind } from "@/lib/product-pricing";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { deleteProductAction, saveProductAction, saveProductSectionAction } from "@/app/admin/store-actions";
import { productStatusLabels } from "@/components/control-room/products";
import { PendingPhotos, type PendingPhoto } from "@/components/control-room/pending-photos";
import { DeleteForm, Field, SaveBar, Toggle, useCrForm } from "@/components/control-room/store-shared";
import { saveProductWithPhotos } from "@/lib/product-photo-upload";
import { OptionPicker } from "@/components/control-room/option-picker";
import { Resettable } from "@/components/control-room/resettable";
import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";
import type { AdminProduct } from "@/lib/store-admin";
import {
  PRODUCT_SECTIONS,
  type ProductSection,
  formatMoneyInput,
  parseList,
  parseMoney,
  PRODUCT_BADGES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
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

export function ProductForm({ product, canManage, canCustomizeAddress = false }: { product: AdminProduct | null; canManage: boolean; canCustomizeAddress?: boolean }) {
  const { t } = useLanguage();
  return <>
    {(product ? PRODUCT_SECTIONS : [undefined]).map(section => <Resettable key={section ?? "new"}>{reset => <ProductFields product={product} canManage={canManage} canCustomizeAddress={canCustomizeAddress} section={section} reset={reset} />}</Resettable>)}
    {product && canManage && <section className="crs-danger"><div><h3>{t.crsDeleteProduct}</h3><p>{t.crsDeleteProductDesc}</p></div><DeleteForm action={deleteProductAction} id={product.id} confirm="crsDeleteProductConfirm" /></section>}
  </>;
}

function ProductFields({ product, canManage, canCustomizeAddress, section, reset }: { product: AdminProduct | null; canManage: boolean; canCustomizeAddress: boolean; section?: ProductSection; reset: () => void }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const { state, formAction, pending, onSubmit } = useCrForm(section
    ? saveProductSectionAction
    : product
      ? saveProductAction
      : (previous, data) => saveProductWithPhotos(previous, data, photos.map(({ file }) => file), router.push));

  const { usdRate } = useCurrency();
  const [currency, setCurrency] = useState<StoreCurrency>(parseCurrency(product?.currency));
  const [alternatePrice, setAlternatePrice] = useState<string | null>(product?.alternatePriceMinor == null ? null : formatMoneyInput(product.alternatePriceMinor));
  // Keep exact typed values when switching back; conversion rounding must not change the original price.
  const priceCache = useRef<Partial<Record<StoreCurrency, string>>>({});
  const discountCache = useRef<Partial<Record<StoreCurrency, string>>>({});
  const [price, setPrice] = useState(product ? formatMoneyInput(product.priceMinor) : "");
  const [discountKind, setDiscountKind] = useState<SaleDiscountKind>(product?.discountKind ?? "none");
  const [discountValue, setDiscountValue] = useState(product?.discountKind === "percent" ? String(product.discountValue) : product?.discountKind === "fixed" ? formatMoneyInput(product.discountValue) : "");
  const regularMinor = parseMoney(price);
  const discountMinor = discountKind === "percent" ? Number(discountValue) : parseMoney(discountValue) ?? 0;
  const saleMinor = regularMinor === null ? null : salePriceMinor(regularMinor, discountKind, discountMinor);
  const otherCurrency: StoreCurrency = currency === "LKR" ? "USD" : "LKR";
  const convertedMinor = regularMinor === null ? null : convertCurrencyMinor(regularMinor, currency, otherCurrency, usdRate);
  const otherPrice = alternatePrice ?? (convertedMinor === null ? "" : formatMoneyInput(convertedMinor));
  const otherMinor = parseMoney(otherPrice);
  const otherSale = regularMinor === null || saleMinor === null || otherMinor === null ? null : alternatePrice === null ? convertCurrencyMinor(saleMinor, currency, otherCurrency, usdRate) : alternateSalePrice(regularMinor, saleMinor, otherMinor, discountKind, discountMinor);
  function changeCurrency(next: StoreCurrency) {
    if (next === currency) return;
    // A blank new form may change currency. Existing money cannot be relabelled without a rate or custom price.
    if (price && (regularMinor === null || otherMinor === null || otherMinor > 100_000_000)) return;
    const custom = alternatePrice !== null;
    const nextPrice = custom ? otherPrice : priceCache.current[next] ?? otherPrice;
    if (discountKind === "fixed" && regularMinor !== null && regularMinor > 0 && otherMinor !== null) {
      const convertedDiscount = custom ? Math.round(discountMinor * otherMinor / regularMinor) : convertCurrencyMinor(discountMinor, currency, next, usdRate);
      if (convertedDiscount === null) return;
      discountCache.current[currency] = discountValue;
      setDiscountValue(discountCache.current[next] ?? formatMoneyInput(convertedDiscount));
    }
    priceCache.current[currency] = price;
    setPrice(nextPrice);
    setAlternatePrice(custom ? price : null);
    setCurrency(next);
  }
  const activeVariants = (product?.variants ?? []).filter((variant) => variant.active);
  const [name, setName] = useState(product?.name ?? "");
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
        {section && <input type="hidden" name="section" value={section} />}
        {(!section || section === "basics") && (
        <fieldset className="crs-fieldset" disabled={!canManage || pending}>
          <legend>{t.crsBasics}</legend>
          <div className="crs-section-fields">
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
                }}
              />
            </Field>
            {canCustomizeAddress && <ProductAddressField key={product?.slug ?? "new"} name={name} savedSlug={product?.slug} />}
            <Field label="crStatus" hint="crsStatusHint">
              <RoundedSelect name="status" defaultValue={product?.status ?? "draft"}>
                {PRODUCT_STATUSES.map((value) => <option key={value} value={value}>{t[productStatusLabels[value]]}</option>)}
              </RoundedSelect>
            </Field>
            <Field label="crsCategory">
              <RoundedSelect name="category" defaultValue={product?.category ?? ""}>
                <option value="">{t.crsNone}</option>
                {PRODUCT_CATEGORIES.map((value) => <option key={value} value={value}>{t[categoryLabels[value]]}</option>)}
              </RoundedSelect>
            </Field>
            <Field label="crsBadge">
              <RoundedSelect name="badge" defaultValue={product?.badge ?? ""}>
                <option value="">{t.crsNone}</option>
                {PRODUCT_BADGES.map((value) => <option key={value} value={value}>{t[badgeLabels[value]]}</option>)}
              </RoundedSelect>
            </Field>
            <Field label="crsPosition" hint="crsPositionHint">
              <input name="position" type="number" min={0} max={9999} step={1} defaultValue={product?.position ?? 0} />
            </Field>
          </div>
          <Toggle name="comingSoon" label="crsComingSoon" hint="crsComingSoonHint" defaultChecked={product?.comingSoon ?? false} />
          <Toggle name="featured" label="crsFeatured" hint="crsFeaturedHint" defaultChecked={product?.featured ?? false} />

          </div></fieldset>)}

        {(!section || section === "pricing") && <fieldset className="crs-fieldset" disabled={!canManage || pending}>
          <legend>{t.crPricingTitle}</legend>
          <div className="crs-section-fields cr-pricing-fields">
            <div className="cr-pricing-settings">
              <Field label="crProductCurrency"><RoundedSelect name="currency" value={currency} onValueChange={value => changeCurrency(parseCurrency(value))}><option value="LKR">LKR — {t.storeLkrName}</option><option value="USD">USD — {t.storeUsdName}</option></RoundedSelect></Field>
              <p className="crs-hint">{t.crCurrencyChangeHint}</p>
            </div>
            <div className="cr-price-cards">
              {[{ code: currency, regular: regularMinor, sale: saleMinor, base: true }, { code: otherCurrency, regular: otherMinor, sale: otherSale, base: false }].map(item => <div className="cr-price-card" key={item.base ? "base" : "alternate"}>
                <div className="cr-price-card-heading"><strong>{item.code}</strong><span className="cr-price-mode">{item.base ? t.crBasePrice : alternatePrice === null ? t.crAutomaticPrice : t.crCustomPrice}</span></div>
                <div className="crs-field">
                  <label className="crs-label" htmlFor={`${item.base ? "base" : "alternate"}-${section ?? "new"}`}>{t.crRegularPrice}</label>
                  <input id={`${item.base ? "base" : "alternate"}-${section ?? "new"}`} name={item.base ? "price" : undefined} aria-label={`${item.code} ${t.crRegularPrice}`} aria-describedby={`${item.base ? "base" : "alternate"}-hint-${section ?? "new"}`} inputMode="decimal" required={item.base || alternatePrice !== null} value={item.base ? price : otherPrice} pattern="[0-9,]{1,9}(\.[0-9]{1,2})?" placeholder="0.00" onChange={event => { if (item.base) setPrice(event.target.value); else setAlternatePrice(event.target.value); priceCache.current = {}; discountCache.current = {}; }} />
                </div>
                <div className="cr-price-card-help"><small className="crs-hint" id={`${item.base ? "base" : "alternate"}-hint-${section ?? "new"}`}>{item.base ? t.crBasePriceHint : alternatePrice !== null ? t.crCustomPriceHint : usdRate === null ? t.crRateUnavailable : t.crAutoPriceHint}</small>{!item.base && alternatePrice !== null && <button className="cr-price-auto" type="button" onClick={event => { setAlternatePrice(null); priceCache.current = {}; discountCache.current = {}; editorChanged(event.currentTarget); }}>{t.crUseAutomaticPrice}</button>}</div>
                <div className="cr-price-card-total" aria-live="polite"><span>{t.crCustomerPrice}</span><div><output>{item.sale === null ? "—" : `${!item.base && alternatePrice === null ? "≈ " : ""}${formatMoney(item.sale, item.code)}`}</output>{item.regular !== null && item.sale !== item.regular && <del>{formatMoney(item.regular, item.code)}</del>}</div></div>
              </div>)}
            </div>
            <input type="hidden" name="alternatePrice" value={alternatePrice ?? ""} />
            <div className="crs-grid cr-discount-fields">
              <Field label="crProductDiscount"><RoundedSelect name="discountKind" value={discountKind} onValueChange={value => { setDiscountKind(value as SaleDiscountKind); setDiscountValue(""); discountCache.current = {}; }}><option value="none">{t.crNoDiscount}</option><option value="percent">{t.crsKindPercent}</option><option value="fixed">{t.crsKindFixed}</option></RoundedSelect></Field>
              {discountKind !== "none" && <Field label={discountKind === "percent" ? "crsPercentOff" : "crDiscountAmount"} hint={discountKind === "percent" ? "crSalePercentHint" : "crSelectedCurrencyHint"}><input name="discountValue" required type={discountKind === "percent" ? "number" : "text"} min={discountKind === "percent" ? 1 : undefined} max={discountKind === "percent" ? 99 : undefined} step={discountKind === "percent" ? 1 : undefined} inputMode={discountKind === "percent" ? "numeric" : "decimal"} value={discountValue} onChange={event => { setDiscountValue(event.target.value); discountCache.current = {}; }} /></Field>}
              {discountKind === "none" && <input type="hidden" name="discountValue" value="" />}
            </div>
            {discountKind !== "none" && <p className="crs-hint">{t.crDualDiscountHint}</p>}
          </div>
        </fieldset>}

        {(!section || section === "details") && (
        <fieldset className="crs-fieldset" disabled={!canManage || pending}>
          <legend>{t.crsDetails}</legend>
          <div className="crs-section-fields">
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

          </div></fieldset>)}

        {(!section || section === "sinhala") && (
        <fieldset className="crs-fieldset" disabled={!canManage || pending}>
          <legend>{t.crsSinhala}</legend>
          <div className="crs-section-fields">
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

          </div></fieldset>)}

        {(!section || section === "stock") && (
        <fieldset className="crs-fieldset" disabled={!canManage || pending}>
          <legend>{t.crsStockTitle}</legend>
          <div className="crs-section-fields">
          <div className="crs-grid">
            <Field label="crsSizes" hint="crsSizesHint">
              <OptionPicker name="sizes" value={sizes} onChange={setSizes} options={["XS", "S", "M", "L", "XL", "2XL", "3XL", "One size"]} maxLength={16} />
            </Field>
            <Field label="crsColors" hint="crsColorsHint">
              <OptionPicker name="colors" value={colors} onChange={setColors} options={["Black", "White", "Washed black", "Grey", "Navy", "Brown", "Green", "Red", "Beige"]} maxLength={40} />
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

          </div></fieldset>)}

        {!product && <PendingPhotos photos={photos} onChange={setPhotos} disabled={!canManage || pending} />}
        <SaveBar pending={pending} state={state} canManage={canManage} label={product ? "crSaveSection" : "crsCreateProduct"} onReset={reset} />
      </form>


    </>
  );
}
