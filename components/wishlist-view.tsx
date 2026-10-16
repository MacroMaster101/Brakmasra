"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, Heart, Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { useLanguage } from "@/components/language-provider";
import { useWishlist } from "@/lib/wishlist";
import { matchesShopCategory, shopCategories } from "@/data/shop-menu";
import { WISHLIST_TOOLS_THRESHOLD, wishlistResults, type WishlistFilters } from "@/lib/wishlist-catalog";

export function WishlistView({ products, commerceEnabled }: { products: Product[]; commerceEnabled: boolean }) {
  const { t } = useLanguage();
  const { slugs, ready } = useWishlist();
  const saved = products.filter(product => slugs.includes(product.slug));
  const toolsId = useId();
  const [toolsOpen, setToolsOpen] = useState<boolean | null>(null);
  const [filters, setFilters] = useState<WishlistFilters>({ query: "", category: "all", color: "all", sort: "recent" });
  const hasFilters = Boolean(filters.query.trim() || filters.category !== "all" || filters.color !== "all");
  const showTools = toolsOpen ?? saved.length >= WISHLIST_TOOLS_THRESHOLD;
  const results = wishlistResults(products, slugs, filters);
  const categories = shopCategories.filter(category => category.id === filters.category || saved.some(product => matchesShopCategory(product, category.id)));
  const colors = [...new Set(saved.flatMap(product => product.colors.map(color => color.trim().toLowerCase())).filter(Boolean))];
  if (filters.color !== "all" && !colors.includes(filters.color)) colors.push(filters.color);
  const update = <K extends keyof WishlistFilters>(key: K, value: WishlistFilters[K]) => {
    setFilters(current => ({ ...current, [key]: value }));
    setToolsOpen(true);
  };
  const clear = () => setFilters(current => ({ ...current, query: "", category: "all", color: "all" }));

  return <section className="wishlist-page" aria-labelledby="wishlist-title">
    <header className="wishlist-heading">
      <div><h1 id="wishlist-title">{t.storeWishlist}</h1>{ready && saved.length > 0 && <p role="status">{t.wishlistCount(saved.length)}</p>}</div>
      {ready && saved.length > 0 && <div className="wishlist-actions">
        <button className="wishlist-tools-toggle" type="button" aria-expanded={showTools} aria-controls={toolsId} onClick={() => setToolsOpen(!showTools)}><SlidersHorizontal aria-hidden="true" /><span>{t.wishlistTools}</span></button>
        <Link href="/shop">{t.wishlistContinue}<ArrowRight aria-hidden="true" /></Link>
      </div>}
    </header>
    <div className="wishlist-content">
      {!ready ? <div className="wishlist-loading" role="status" aria-label={t.wishlistLoading}>
        <span className="sr-only">{t.wishlistLoading}</span>
        {[0, 1, 2, 3].map(item => <div className="wishlist-placeholder" key={item} aria-hidden="true" />)}
      </div> : saved.length ? <>
        <section className="wishlist-tools" id={toolsId} aria-label={t.wishlistTools} hidden={!showTools}>
          <label className="wishlist-search"><span>{t.wishlistSearch}</span><span><Search aria-hidden="true" /><input type="search" value={filters.query} onChange={event => update("query", event.target.value)} placeholder={t.wishlistSearch} maxLength={100} /></span></label>
          {(categories.length > 1 || filters.category !== "all") && <label><span>{t.storeCategoryLabel}</span><select value={filters.category} onChange={event => update("category", event.target.value)}><option value="all">{t.storeAllCategories}</option>{categories.map(category => <option value={category.id} key={category.id}>{t[category.labelKey]}</option>)}</select></label>}
          {(colors.length > 1 || filters.color !== "all") && <label><span>{t.storeColorLabel}</span><select value={filters.color} onChange={event => update("color", event.target.value)}><option value="all">{t.storeAllColors}</option>{colors.map(color => <option value={color} key={color}>{color === "white" ? t.storeColorWhite : color === "black" ? t.storeColorBlack : color.charAt(0).toUpperCase() + color.slice(1)}</option>)}</select></label>}
          <label><span>{t.storeSort}</span><select value={filters.sort} onChange={event => update("sort", event.target.value as WishlistFilters["sort"])}><option value="recent">{t.wishlistRecent}</option><option value="name">{t.storeName}</option><option value="name-desc">{t.wishlistNameDescending}</option></select></label>
        </section>
        {(showTools || hasFilters) && <div className="wishlist-results"><p role="status">{t.wishlistResults(results.length, saved.length)}</p>{hasFilters && <button type="button" onClick={clear}><X aria-hidden="true" />{t.storeClearFilters}</button>}</div>}
        {results.length ?
        <div className="product-grid wishlist-grid">
          {results.map((product, index) => <ProductCard key={product.id} product={product} commerceEnabled={commerceEnabled} removeOnly priority={index < 4} />)}
        </div> : <div className="wishlist-no-results"><Search aria-hidden="true" /><h2>{t.storeNoFilterMatches}</h2><p>{t.wishlistNoMatches}</p><button className="button button-primary" type="button" onClick={clear}>{t.storeClearFilters}</button></div>}
      </> : <div className="wishlist-empty">
        <span className="wishlist-empty-icon"><Heart aria-hidden="true" /></span>
        <h2>{t.wishlistEmptyTitle}</h2>
        <p>{t.storeEmptySavedDesc}</p>
        <Link className="button button-primary" href="/shop">{t.homeExploreBtn}<ArrowRight aria-hidden="true" /></Link>
      </div>}
    </div>
  </section>;
}
