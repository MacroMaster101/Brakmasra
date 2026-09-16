"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Product, ProductCategory } from "@/data/products";
import { searchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export function ShopCatalog({ products, commerceEnabled }: { products: Product[]; commerceEnabled: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ProductCategory>("All");
  const matchingCategory = category === "All" ? products : products.filter((product) => product.category === category);
  const results = searchProducts(query, matchingCategory);
  const categories: Array<"All" | ProductCategory> = ["All", "Apparel", "Headwear"];

  return (
    <>
      <div className="shop-tools">
        <label className="search-field">
          <Search />
          <span className="sr-only">Search products</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" />
        </label>
        <div className="category-filter" aria-label="Filter by category">
          {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </div>
      <p className="result-count" aria-live="polite">Showing {results.length} {results.length === 1 ? "product" : "products"}</p>
      {results.length ? (
        <div className="shop-grid">
          {results.map((product) => <ProductCard key={product.id} product={product} commerceEnabled={commerceEnabled} />)}
        </div>
      ) : (
        <div className="empty-state"><h2>Nothing matches “{query.trim()}”</h2><p>Try a different word, or clear the search to see every product.</p></div>
      )}
    </>
  );
}
