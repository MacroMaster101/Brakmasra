"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AddToCart } from "@/components/add-to-cart";
import { ProductComingSoon } from "@/components/coming-soon";
import { useLanguage } from "@/components/language-provider";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/cart";
import { productCopy } from "@/lib/catalog";
import { isRemoteImage } from "@/lib/store-mapping";

export function ProductDetails({ product, commerceEnabled }: { product: Product; commerceEnabled: boolean }) {
  const { t, lang } = useLanguage();
  const copy = productCopy(product, lang);
  const category = product.category === "Apparel"
    ? t.shopFilterApparel
    : product.category === "Headwear"
      ? t.shopFilterHeadwear
      : product.category;

  return (
    <>
      <Link className="text-link" href="/shop"><ArrowLeft />{t.shopBackToShop}</Link>
      <div className="product-detail">
        <div className="product-gallery">
          {product.images.map((src, index) => (
            <div key={src} className="product-detail-image">
              <Image
                src={src}
                unoptimized={isRemoteImage(src)}
                alt={index === 0 ? t.productPhotoAlt(product.name) : t.productViewAlt(product.name, index + 1)}
                fill
                loading={index === 0 ? "eager" : "lazy"}
                sizes="(max-width: 900px) 100vw, 56vw"
              />
            </div>
          ))}
        </div>
        <div className="product-detail-copy">
          {category && <span className="product-category">{category}</span>}
          <h1>{product.name}</h1>
          <p className="product-price">{commerceEnabled ? formatMoney(product.price, product.currency) : t.shopPriceAnnounced}</p>
          <p className="product-description">{copy.description}</p>
          {commerceEnabled ? <AddToCart product={product} /> : <ProductComingSoon />}
          <dl className="product-specs">
            <div>
              <dt>{t.shopMaterial}</dt>
              <dd>{copy.fabric}</dd>
            </div>
            <div>
              <dt>{t.shopCare}</dt>
              <dd>{copy.care.join(". ")}.</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
