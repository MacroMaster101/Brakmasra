import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop-catalog";
import { commerceEnabled } from "@/lib/features";
import { pageMetadata } from "@/lib/seo";
import { getCatalog } from "@/lib/store";

export const metadata: Metadata = pageMetadata({ title: "Official Merch", description: "Shop official BRAKMASRA merchandise and verified limited drops.", path: "/shop" });

export default async function ShopPage() {
  const products = await getCatalog();
  return (
    <div className="page-shell page-top shop-page">
      <ShopCatalog products={products} commerceEnabled={commerceEnabled} />
    </div>
  );
}
