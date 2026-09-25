import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop-catalog";
import { products } from "@/data/products";
import { commerceEnabled } from "@/lib/features";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Official Merch", description: "Shop official BRAKMASRA merchandise and verified limited drops.", path: "/shop" });

export default function ShopPage() {
  return (
    <div className="page-shell page-top shop-page">
      <ShopCatalog products={products} commerceEnabled={commerceEnabled} />
    </div>
  );
}
