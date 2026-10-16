"use client";

import Image from "@/components/store-image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Headphones, MessageCircle, Package, Ruler, Share2, ShoppingBag, X, ZoomIn } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent, type RefObject } from "react";

import { AddToCart } from "@/components/add-to-cart";
import { ProductComingSoon } from "@/components/coming-soon";
import { useLanguage } from "@/components/language-provider";
import type { Product } from "@/data/products";
import { useCurrency } from "@/components/currency-provider";
import { productCopy } from "@/lib/catalog";
import { isRemoteImage } from "@/lib/store-mapping";
import { ProductCard } from "@/components/product-card";
import { CurrencyConversionNote } from "@/components/currency-switcher";
import { lockPageScroll } from "@/lib/page-scroll-lock";

export function ProductDetails({ product, commerceEnabled, related = [] }: { product: Product; commerceEnabled: boolean; related?: Product[] }) {
  const { t, lang } = useLanguage();
  const { formatPrice } = useCurrency();
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const zoom = useRef<HTMLDialogElement>(null);
  const sizing = useRef<HTMLDialogElement>(null);
  const unlock = useRef<(() => void) | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const mainImage = product.images[activeImage] ?? product.images[0];
  const copy = productCopy(product, lang);
  const category = product.category === "Apparel"
    ? t.shopFilterApparel
    : product.category === "Headwear"
      ? t.shopFilterHeadwear
      : product.category;

  const tabLabels = [t.productDescriptionTab, t.productCareTab, t.productDeliveryTab];
  useEffect(() => () => unlock.current?.(), []);
  function release() { unlock.current?.(); unlock.current = null; }
  function open(dialog: RefObject<HTMLDialogElement | null>) { if (!dialog.current) return; release(); unlock.current = lockPageScroll(); dialog.current.showModal(); }
  function backdrop(event: MouseEvent<HTMLDialogElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) event.currentTarget.close();
  }
  function changeImage(direction: number) { setActiveImage(current => (current + direction + product.images.length) % product.images.length); }

  return <section className="pdp" aria-labelledby={`${id}-title`}>
    <nav className="pdp-breadcrumb" aria-label={t.storeBreadcrumb}><Link href="/">{t.navHome}</Link><ChevronRight aria-hidden="true" /><Link href="/shop">{t.navShop}</Link><ChevronRight aria-hidden="true" /><span aria-current="page">{product.name}</span></nav>
    <div className="pdp-layout">
      <div className="pdp-gallery" role="group" aria-label={t.productGallery}>
        {product.images.length > 1 && <div className="pdp-thumbnails">{product.images.map((src, index) => <button key={`${src}-${index}`} type="button" aria-label={index === 0 ? t.productPhotoAlt(product.name) : t.productViewAlt(product.name, index + 1)} aria-pressed={index === activeImage} onClick={() => setActiveImage(index)}><Image src={src} unoptimized={isRemoteImage(src)} alt="" fill sizes="76px" /></button>)}</div>}
        <div className="pdp-stage">
          {mainImage ? <button className="pdp-zoom-trigger" type="button" onClick={() => open(zoom)} aria-label={t.productZoom}><Image key={mainImage} src={mainImage} unoptimized={isRemoteImage(mainImage)} alt={activeImage === 0 ? t.productPhotoAlt(product.name) : t.productViewAlt(product.name, activeImage + 1)} fill loading="eager" sizes="(max-width: 767px) 100vw, (max-width: 1199px) 46vw, 620px" /><span className="pdp-zoom-icon"><ZoomIn aria-hidden="true" /></span></button> : <div className="pdp-image-missing"><ShoppingBag aria-hidden="true" /><span>{t.productImageUnavailable}</span></div>}
          {product.images.length > 1 && <><button type="button" className="pdp-gallery-prev" onClick={() => changeImage(-1)} aria-label={t.productPreviousImage}><ChevronLeft aria-hidden="true" /></button><button type="button" className="pdp-gallery-next" onClick={() => changeImage(1)} aria-label={t.productNextImage}><ChevronRight aria-hidden="true" /></button><span className="pdp-image-count" aria-live="polite">{activeImage + 1} / {product.images.length}</span></>}
        </div>
      </div>
      <div className="pdp-copy">
        {category && <span className="pdp-category">{category}</span>}
        <h1 id={`${id}-title`}>{product.name}</h1>
        <p className="pdp-price">{commerceEnabled ? formatPrice(product.price, product.currency) : t.shopPriceAnnounced}</p>
        <CurrencyConversionNote />
        <p className="pdp-intro">{copy.description}</p>
        {commerceEnabled ? <AddToCart product={product} /> : <ProductComingSoon />}
        <div className="pdp-help">
          {product.sizes.length > 0 && <button type="button" onClick={() => open(sizing)}><Ruler aria-hidden="true" />{t.productFitSizing}</button>}
          <Link href="/contact"><MessageCircle aria-hidden="true" />{t.productAskQuestion}</Link>
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href.split("#")[0]); setCopied("done"); } catch { setCopied("failed"); } }}><Share2 aria-hidden="true" />{t.productShare}</button>
        </div>
        {copied && <p className="pdp-share-status" role="status">{copied === "done" ? t.productLinkCopied : t.productLinkCopyFailed}</p>}
        <div className="pdp-service"><Package aria-hidden="true" /><div><strong>{t.shopMaterial}</strong><p>{copy.fabric}</p></div></div>
        <Link href="/contact" className="pdp-service"><Headphones aria-hidden="true" /><div><strong>{t.storeCustomerService}</strong><p>{t.storeSupportDesc}</p></div><ArrowRight aria-hidden="true" /></Link>
      </div>
    </div>
    <section className="pdp-information" aria-label={t.productInformation}>
      <div className="pdp-tabs" role="tablist" aria-label={t.productInformation}>{tabLabels.map((label, index) => <button key={label} ref={node => { tabs.current[index] = node; }} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={activeTab === index} aria-controls={`${id}-panel-${index}`} tabIndex={activeTab === index ? 0 : -1} onClick={() => setActiveTab(index)} onKeyDown={event => { let next = index; if (event.key === "ArrowRight") next = (index + 1) % tabLabels.length; else if (event.key === "ArrowLeft") next = (index + tabLabels.length - 1) % tabLabels.length; else if (event.key === "Home") next = 0; else if (event.key === "End") next = tabLabels.length - 1; else return; event.preventDefault(); setActiveTab(next); tabs.current[next]?.focus({ preventScroll: true }); }}>{label}</button>)}</div>
      <div id={`${id}-panel-0`} className="pdp-tab-panel" role="tabpanel" aria-labelledby={`${id}-tab-0`} tabIndex={0} hidden={activeTab !== 0}><p>{copy.description}</p></div>
      <div id={`${id}-panel-1`} className="pdp-tab-panel" role="tabpanel" aria-labelledby={`${id}-tab-1`} tabIndex={0} hidden={activeTab !== 1}><div className="pdp-care-grid"><div><h2>{t.shopMaterial}</h2><p>{copy.fabric}</p></div><div><h2>{t.shopCare}</h2><ul>{copy.care.map(care => <li key={care}>{care}</li>)}</ul></div></div></div>
      <div id={`${id}-panel-2`} className="pdp-tab-panel" role="tabpanel" aria-labelledby={`${id}-tab-2`} tabIndex={0} hidden={activeTab !== 2}><p>{t.productDeliveryInfo}</p><div className="pdp-policy-links"><Link href="/terms#store">{t.legalTerms}<ArrowRight aria-hidden="true" /></Link><Link href="/contact">{t.navContact}<ArrowRight aria-hidden="true" /></Link></div></div>
    </section>
    {related.length > 0 && <section className="pdp-related" aria-labelledby={`${id}-related`}><div><h2 id={`${id}-related`}>{t.productRelated}</h2><Link href="/shop">{t.storeViewAll}<ArrowRight aria-hidden="true" /></Link></div><div className="product-grid">{related.map(item => <ProductCard key={item.id} product={item} commerceEnabled={commerceEnabled} />)}</div></section>}
    <dialog ref={zoom} className="store-dialog pdp-zoom-dialog" aria-label={t.productZoom} onClick={backdrop} onClose={release} onKeyDown={event => { if (product.images.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); changeImage(event.key === "ArrowLeft" ? -1 : 1); } }}>
      <button type="button" className="pdp-dialog-close" onClick={() => zoom.current?.close()} aria-label={t.storeClose}><X aria-hidden="true" /></button>
      {mainImage && <div className="pdp-enlarged-image"><Image src={mainImage} unoptimized={isRemoteImage(mainImage)} alt={t.productPhotoAlt(product.name)} fill sizes="(max-width: 767px) 100vw, 900px" /></div>}
      {product.images.length > 1 && <div className="pdp-zoom-navigation"><button type="button" onClick={() => changeImage(-1)} aria-label={t.productPreviousImage}><ChevronLeft aria-hidden="true" /></button><span aria-live="polite">{activeImage + 1} / {product.images.length}</span><button type="button" onClick={() => changeImage(1)} aria-label={t.productNextImage}><ChevronRight aria-hidden="true" /></button></div>}
    </dialog>
    <dialog ref={sizing} className="store-dialog pdp-sizing-dialog" aria-labelledby={`${id}-sizing`} onClick={backdrop} onClose={release}><button type="button" className="pdp-dialog-close" onClick={() => sizing.current?.close()} aria-label={t.storeClose}><X aria-hidden="true" /></button><Ruler className="pdp-sizing-icon" aria-hidden="true" /><h2 id={`${id}-sizing`}>{t.productFitSizing}</h2><p>{t.productSizingInfo}</p><p className="pdp-available-sizes"><strong>{t.cartSize}</strong>{product.sizes.join(" / ")}</p><Link className="button button-primary" href="/contact" onClick={() => sizing.current?.close()}>{t.productAskQuestion}<ArrowRight aria-hidden="true" /></Link></dialog>
  </section>;
}
