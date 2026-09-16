import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop-catalog";
import { products } from "@/data/products";
import { commerceEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Official Merch", description: "Shop official BRAKMASRA merchandise and verified limited drops.", alternates: { canonical: "/shop" } };

export default function ShopPage() {
  return (
    <div className="page-shell page-top shop-page">
      <header className="page-hero"><span className="eyebrow">Upcoming collection</span><h1>Carry the unknown.</h1><p>Dark apparel and objects shaped by the places we explore.</p></header>
      <div className="catalog-note"><strong>Launch status</strong><span>Ordering is not open yet. Final prices, sizes, and availability will be announced before release.</span></div>
      <ShopCatalog products={products} commerceEnabled={commerceEnabled} />
    </div>
  );
}
