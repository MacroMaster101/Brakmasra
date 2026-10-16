"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Bell, Search, X } from "lucide-react";
import Link from "next/link";
import Image from "@/components/store-image";
import type { Product } from "@/data/products";
import { matchesShopCategory, shopCategories } from "@/data/shop-menu";
import { searchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { useLanguage } from "@/components/language-provider";
import { WishlistView } from "@/components/wishlist-view";

export function ShopCatalog({
  products,
  commerceEnabled,
  collections = [],
  collection,
}: {
  products: Product[];
  commerceEnabled: boolean;
  collections?: { slug: string; name: string }[];
  collection?: { name: string; description: string };
}) {
  const { t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const initialQuery = params.get("q") ?? "";
  const context = `${params.get("collection") ?? "all"}:${params.get("category") ?? "all"}:${params.get("saved") ?? "0"}:${initialQuery}`;
  const [queryOverride, setQuery] = useState<{
    initial: string;
    value: string;
  } | null>(null);
  const [sort, setSort] = useState("featured");
  const query =
    queryOverride?.initial === context
      ? queryOverride.value
      : initialQuery;
  const color = ["black", "white"].includes(params.get("color") ?? "") ? params.get("color")! : "all";
  const savedOnly = params.get("saved") === "1";
  const category = shopCategories.find((item) => item.id === params.get("category"));
  const upcoming = category && !products.some((product) => matchesShopCategory(product, category.id));
  const updateColor = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete("color"); else next.set("color", value);
    if (query.trim()) next.set("q", query); else next.delete("q");
    router.replace(`/shop${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const clearFilters = () => {
    setQuery({ initial: context, value: "" });
    setSort("featured");
    const next = new URLSearchParams();
    if (category) next.set("category", category.id);
    if (params.get("collection")) next.set("collection", params.get("collection")!);
    router.replace(`/shop${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const filtered = products.filter(
    (product) =>
      (!category || matchesShopCategory(product, category.id)) &&
      (color === "all" ||
        product.colors.some((value) => value.toLowerCase().includes(color))),
  );
  const results = [...searchProducts(query, filtered)].sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  );
  if (savedOnly) return <WishlistView products={products} commerceEnabled={commerceEnabled} />;
  if (upcoming) return (
    <section className="category-preview" aria-labelledby="category-title">
      <nav className="shop-breadcrumb" aria-label={t.storeBreadcrumb}>
        <Link href="/shop">{t.navShop}</Link><span aria-hidden="true">/</span><span aria-current="page">{t[category.labelKey]}</span>
      </nav>
      <div className="category-preview-layout">
        <div className="category-preview-copy">
          <span className="category-status"><span aria-hidden="true" />{t.shopComingSoon}</span>
          <h1 id="category-title">{t[category.labelKey]}</h1>
          <p className="category-preview-intro">{t.storeCategorySoonTitle}</p>
          <p>{t.storeCategorySoonDesc}</p>
          <div className="category-preview-actions">
            <Link className="button button-primary" href="/#drop-alerts">{t.homeNewsletterBtn}<Bell aria-hidden="true" /></Link>
            <Link className="text-link" href="/shop">{t.storeBackShop}<ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
        <Link className="category-preview-photo" href="/shop?category=tees">
          <Image src="/images/about/graphic-still-life.webp" alt={t.storeCategoryPreviewAlt} width={1448} height={1086} sizes="(max-width: 760px) 100vw, 48vw" priority />
          <span className="category-preview-photo-caption"><span><small>{t.storeWhileYouWait}</small><strong>{t.storeExploreTees}</strong></span><span className="category-photo-arrow"><ArrowRight aria-hidden="true" /></span></span>
        </Link>
      </div>
    </section>
  );
  return (
    <>
      <header className="page-hero">
        <span className="eyebrow">{t.shopHeroEyebrow}</span>
        <h1>{collection?.name ?? (category ? t[category.labelKey] : t.shopHeroTitle)}</h1>
        <p>{collection?.description || t.shopHeroDesc}</p>
      </header>
      {collections.length > 0 && <nav className="catalog-collections" aria-label={t.storeCollection}><Link href="/shop" aria-current={!collection ? "page" : undefined}>{t.storeBrowseAll}</Link>{collections.map((item) => <Link key={item.slug} href={`/shop?collection=${item.slug}`} aria-current={params.get("collection") === item.slug ? "page" : undefined}>{item.name}</Link>)}</nav>}
      {!commerceEnabled && (
        <div className="catalog-note">
          <strong>{t.shopLaunchStatus}</strong>
          <span>{t.shopLaunchDesc}</span>
        </div>
      )}
      <section className="catalog-filters" aria-label={t.shopFilterLabel}>
      <div className="catalog-filter-top">
        <label className="catalog-control catalog-category">
          <span>{t.storeCategoryLabel}</span>
          <select value={category?.id ?? "all"} onChange={(event) => router.push(event.target.value === "all" ? "/shop" : `/shop?category=${event.target.value}`)}>
            <option value="all">{t.storeAllCategories}</option>
            {shopCategories.map((item) => <option key={item.id} value={item.id}>{t[item.labelKey]}{products.some((product) => matchesShopCategory(product, item.id)) ? "" : ` · ${t.shopComingSoon}`}</option>)}
          </select>
        </label>
        <label className="catalog-search-control">
          <span>{t.storeSearchButton}</span>
          <span className="search-field">
          <Search />
          <input
            aria-label={t.shopSearchLabel}
            type="search"
            value={query}
            onChange={(event) =>
              setQuery({ initial: context, value: event.target.value })
            }
            placeholder={t.shopSearchPlaceholder}
          />
          </span>
        </label>
        <label className="catalog-control catalog-sort">
          <span>{t.storeSort}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">{t.storeFeatured}</option>
            <option value="name">{t.storeName}</option>
            {commerceEnabled && <><option value="low">{t.storePriceLow}</option><option value="high">{t.storePriceHigh}</option></>}
          </select>
        </label>
      </div>
      <div className="catalog-filter-bottom">
        <div
          className="catalog-colors"
          role="group"
          aria-label={t.storeColorLabel}
        >
          <span className="catalog-color-label">{t.storeColorLabel}</span>
          {[
            ["all", t.storeAllColors],
            ["black", t.storeColorBlack],
            ["white", t.storeColorWhite],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={color === value}
              onClick={() => updateColor(value)}
            >
              {value !== "all" && <span className={`catalog-swatch is-${value}`} aria-hidden="true" />}{label}
            </button>
          ))}
        </div>
        {(query.trim() || color !== "all") && <button className="catalog-clear" type="button" onClick={clearFilters}><X aria-hidden="true" />{t.storeClearFilters}</button>}
      </div>
      </section>
      <p className="result-count" aria-live="polite">
        {t.shopResultCount(results.length)}
      </p>
      {category && <p className="shop-category-reset"><Link href="/shop">{t.storeBrowseAll}</Link></p>}
      {results.length ? (
        <div className="product-grid">
          {results.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              commerceEnabled={commerceEnabled}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>
            {query.trim() ? t.shopNoResultsTitle(query.trim()) : t.storeNoFilterMatches}
          </h2>
          <p>{t.storeNoFilterMatchesDesc}</p>
          <button className="button button-primary" type="button" onClick={clearFilters}>{t.storeClearFilters}</button>
        </div>
      )}
    </>
  );
}
