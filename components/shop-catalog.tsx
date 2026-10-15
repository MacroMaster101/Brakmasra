"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/data/products";
import { searchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { useLanguage } from "@/components/language-provider";
import { useWishlist } from "@/lib/wishlist";

export function ShopCatalog({
  products,
  commerceEnabled,
}: {
  products: Product[];
  commerceEnabled: boolean;
}) {
  const { t } = useLanguage();
  const params = useSearchParams();
  const { slugs } = useWishlist();
  const initialQuery = params.get("q") ?? "";
  const initialColor = params.get("color") ?? "all";
  const [queryOverride, setQuery] = useState<{
    initial: string;
    value: string;
  } | null>(null);
  const [colorOverride, setColor] = useState<{
    initial: string;
    value: string;
  } | null>(null);
  const [sort, setSort] = useState("featured");
  const query =
    queryOverride?.initial === initialQuery
      ? queryOverride.value
      : initialQuery;
  const color =
    colorOverride?.initial === initialColor
      ? colorOverride.value
      : initialColor;
  const savedOnly = params.get("saved") === "1";
  const filtered = products.filter(
    (product) =>
      (!savedOnly || slugs.includes(product.slug)) &&
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
          : 0,
  );
  return (
    <>
      <header className="page-hero">
        <span className="eyebrow">{t.shopHeroEyebrow}</span>
        <h1>{savedOnly ? t.storeSaved : t.shopHeroTitle}</h1>
        <p>{savedOnly ? t.storeEmptySavedDesc : t.shopHeroDesc}</p>
      </header>
      {!commerceEnabled && (
        <div className="catalog-note">
          <strong>{t.shopLaunchStatus}</strong>
          <span>{t.shopLaunchDesc}</span>
        </div>
      )}
      <div className="shop-tools">
        <label className="search-field">
          <Search />
          <span className="sr-only">{t.shopSearchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery({ initial: initialQuery, value: event.target.value })
            }
            placeholder={t.shopSearchPlaceholder}
          />
        </label>
        <div
          className="collection-tabs"
          role="group"
          aria-label={t.shopFilterLabel}
        >
          {[
            ["all", t.storeAllTees],
            ["black", t.storeBlackTees],
            ["white", t.storeWhiteTees],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={color === value}
              onClick={() => setColor({ initial: initialColor, value })}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="sort-select">
          <span className="sr-only">{t.storeSort}</span>
          <select
            aria-label={t.storeSort}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="featured">{t.storeFeatured}</option>
            <option value="name">{t.storeName}</option>
            {commerceEnabled && (
              <>
                <option value="low">{t.storePriceLow}</option>
                <option value="high">{t.storePriceHigh}</option>
              </>
            )}
          </select>
        </label>
      </div>
      <p className="result-count" aria-live="polite">
        {t.shopResultCount(results.length)}
      </p>
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
            {savedOnly ? t.storeEmptySaved : t.shopNoResultsTitle(query.trim())}
          </h2>
          <p>{savedOnly ? t.storeEmptySavedDesc : t.shopNoResultsDesc}</p>
          {savedOnly && (
            <Link className="button button-primary" href="/shop">
              {t.homeExploreBtn}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
