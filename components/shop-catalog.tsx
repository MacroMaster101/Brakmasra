"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Product, ProductCategory } from "@/data/products";
import { searchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { useLanguage } from "@/components/language-provider";

export function ShopCatalog({
  products,
  commerceEnabled,
}: {
  products: Product[];
  commerceEnabled: boolean;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ProductCategory>("All");
  const matchingCategory =
    category === "All"
      ? products
      : products.filter((product) => product.category === category);
  const results = searchProducts(query, matchingCategory);
  const categories: Array<"All" | ProductCategory> = [
    "All",
    "Apparel",
    "Headwear",
  ];

  const getCategoryLabel = (cat: "All" | ProductCategory) => {
    switch (cat) {
      case "All":
        return t.shopFilterAll;
      case "Apparel":
        return t.shopFilterApparel;
      case "Headwear":
        return t.shopFilterHeadwear;
      default:
        return cat;
    }
  };

  return (
    <>
      <header className="page-hero">
        <span className="eyebrow">{t.shopHeroEyebrow}</span>
        <h1>{t.shopHeroTitle}</h1>
        <p>{t.shopHeroDesc}</p>
      </header>
      <div className="catalog-note">
        <strong>{t.shopLaunchStatus}</strong>
        <span>{t.shopLaunchDesc}</span>
      </div>

      <div className="shop-tools">
        <label className="search-field">
          <Search />
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.shopSearchPlaceholder}
          />
        </label>
        <div className="category-filter" aria-label="Filter by category">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              className={category === item ? "is-active" : ""}
              onClick={() => setCategory(item)}
            >
              {getCategoryLabel(item)}
            </button>
          ))}
        </div>
      </div>
      <p className="result-count" aria-live="polite">
        {t.shopResultCount(results.length)}
      </p>
      {results.length ? (
        <div className="shop-grid">
          {results.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              commerceEnabled={commerceEnabled}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t.shopNoResultsTitle(query.trim())}</h2>
          <p>{t.shopNoResultsDesc}</p>
        </div>
      )}
    </>
  );
}
