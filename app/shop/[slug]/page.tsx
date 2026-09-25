import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product-details";
import { getSiteUrl } from "@/lib/auth";
import { commerceEnabled } from "@/lib/features";
import { pageMetadata } from "@/lib/seo";
import { getCatalogProduct } from "@/lib/store";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getCatalogProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    ...pageMetadata({ title: product.name, description: product.description, path: `/shop/${product.slug}`, images: product.images.slice(0, 1) }),
    robots: product.preview ? { index: false, follow: false } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const [{ slug }, requestHeaders] = await Promise.all([params, headers()]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((src) => new URL(src, siteUrl).toString()),
    brand: { "@type": "Brand", name: "BRAKMASRA" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/shop/${product.slug}`,
      priceCurrency: product.currency,
      price: (product.price / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="page-shell page-top product-page">
      {!product.preview && (
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <ProductDetails product={product} commerceEnabled={commerceEnabled} />
    </div>
  );
}
