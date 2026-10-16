"use client";
import { useState, type RefObject } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import Image from "@/components/store-image";
import { useLanguage } from "@/components/language-provider";
import { shopCategories, type ShopMenu } from "@/data/shop-menu";
import { useSearchHistory } from "@/lib/search-history";

export function SearchPanel({ dialogRef, titleId, menu, onClose }: { dialogRef: RefObject<HTMLDialogElement | null>; titleId: string; menu: ShopMenu; onClose: () => void }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const history = useSearchHistory();
  const close = () => dialogRef.current?.close();
  const needle = query.trim().toLowerCase();
  const matches = needle ? menu.searchItems.filter(item => `${item.name} ${item.description}`.toLowerCase().includes(needle)) : [...menu.searchItems].sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  return <dialog ref={dialogRef} className="store-dialog search-dialog search-panel" aria-labelledby={titleId} onClose={onClose} onClick={event => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
  }}>
    <div className="search-panel-scroll">
    <div className="search-panel-heading"><h2 id={titleId}>{t.storeSearch}</h2><button className="icon-button" type="button" onClick={close} aria-label={t.storeClose}><X /></button></div>
    <form className="search-panel-form" action="/shop" onSubmit={event => {
      if (!query.trim()) { event.preventDefault(); return; }
      history.remember(query); close();
    }}>
      <label className="sr-only" htmlFor={`${titleId}-query`}>{t.shopSearchLabel}</label>
      <input autoFocus id={`${titleId}-query`} type="search" name="q" value={query} onChange={event => setQuery(event.target.value)} placeholder={t.shopSearchPlaceholder} maxLength={100} required />
      <button type="submit" aria-label={t.storeSearchButton}><Search /></button>
    </form>
    <nav className="search-panel-categories" aria-label={t.storeCategoryLabel}>
      {shopCategories.map(category => <Link key={category.id} href={`/shop?category=${category.id}`} onClick={close}>{t[category.labelKey]}</Link>)}
      <Link href="/shop?color=black" onClick={close}>{t.storeBlackTees}</Link><Link href="/shop?color=white" onClick={close}>{t.storeWhiteTees}</Link>
    </nav>
    <section className="search-panel-history" aria-label={t.storeRecentSearches}>
      <div className="search-panel-section-heading"><h3>{t.storeRecentSearches}</h3>{history.entries.length > 0 && <button type="button" onClick={history.clear}>{t.storeClearHistory}</button>}</div>
      {history.entries.length ? history.entries.map(entry => <Link key={entry} href={`/shop?q=${encodeURIComponent(entry)}`} onClick={close}><span>{entry}</span><ArrowUpRight aria-hidden="true" /></Link>) : <p>{t.storeNoSearchHistory}</p>}
    </section>
    <section className="search-panel-products" aria-label={needle ? t.storeSearchResults : t.storeSearchCollection}>
      <div className="search-panel-section-heading"><h3>{needle ? t.storeSearchResults : t.storeSearchCollection}</h3><Link href={needle ? `/shop?q=${encodeURIComponent(query.trim())}` : "/shop"} onClick={() => { if (needle) history.remember(query); close(); }}>{t.storeViewAll}<ArrowRight aria-hidden="true" /></Link></div>
      <div aria-live="polite">{matches.length ? matches.slice(0, 4).map(item => <Link className="search-panel-product" key={item.slug} href={`/shop/${encodeURIComponent(item.slug)}`} onClick={close}>
        {item.images[0] && <span className="search-panel-product-photo"><Image src={item.images[0]} alt="" fill sizes="100px" /></span>}
        <span><small>BRAKMASRA</small><strong>{item.name}</strong><span>{t.storeViewDetails}<ArrowUpRight aria-hidden="true" /></span></span>
      </Link>) : <p className="search-panel-empty">{t.storeNoFilterMatches}</p>}</div>
    </section>
    </div>
  </dialog>;
}
