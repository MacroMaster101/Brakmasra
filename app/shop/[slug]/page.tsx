import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product-details";
import { products } from "@/data/products";
import { findProduct } from "@/lib/catalog";
import { commerceEnabled } from "@/lib/features";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = findProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/shop/${product.slug}` },
    robots: product.preview ? { index: false, follow: false } : undefined,
    openGraph: { title: product.name, description: product.description, images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const [{ slug }, requestHeaders] = await Promise.all([params, headers()]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const product = findProduct(slug);
  if (!product) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
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
