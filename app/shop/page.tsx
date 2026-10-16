import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopCatalog } from "@/components/shop-catalog";
import { commerceEnabled } from "@/lib/features";
import { pageMetadata } from "@/lib/seo";
import { getCatalog, getCatalogCollections } from "@/lib/store";

export const metadata: Metadata = pageMetadata({ title: "Official Merch", description: "Shop official BRAKMASRA merchandise and verified limited drops.", path: "/shop" });

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [products, collections, params] = await Promise.all([getCatalog(), getCatalogCollections(), searchParams]);
  const selected = typeof params.collection === "string" ? collections.find((item) => item.slug === params.collection) : undefined;
  if (params.collection && !selected) notFound();
  const visible = selected && params.saved !== "1" ? selected.productIds.flatMap((id) => products.filter((product) => product.id === id)) : products;
  return (
    <div className="page-shell page-top shop-page">
      <ShopCatalog products={visible} commerceEnabled={commerceEnabled} collections={collections.map(({slug,name}) => ({slug,name}))} collection={selected ? { name: selected.name, description: selected.description } : undefined} />
    </div>
  );
}
