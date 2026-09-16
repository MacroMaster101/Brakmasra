import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { ProductComingSoon } from "@/components/coming-soon";
import { products } from "@/data/products";
import { formatMoney } from "@/lib/cart";
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
      <Link className="text-link" href="/shop"><ArrowLeft />Back to shop</Link>
      <div className="product-detail">
        <div className="product-gallery">
          {product.images.map((src, index) => (
            <div key={src} className="product-detail-image">
              <Image
                src={src}
                alt={index === 0 ? `${product.name} product photo` : `${product.name}, view ${index + 1}`}
                fill
                loading={index === 0 ? "eager" : "lazy"}
                sizes="(max-width: 900px) 100vw, 56vw"
              />
            </div>
          ))}
        </div>
        <div className="product-detail-copy">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-price">{commerceEnabled ? formatMoney(product.price, product.currency) : "Price announced at launch"}</p>
          <p className="product-description">{product.description}</p>
          {commerceEnabled ? <AddToCart product={product} /> : <ProductComingSoon />}
          <dl className="product-specs">
            <div>
              <dt>Material</dt>
              <dd>{product.fabric}</dd>
            </div>
            <div>
              <dt>Care</dt>
              <dd>{product.care.join(". ")}.</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
