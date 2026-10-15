"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { AddToCart } from "@/components/add-to-cart";
import { ProductComingSoon } from "@/components/coming-soon";
import { useLanguage } from "@/components/language-provider";
import type { Product } from "@/data/products";
import { useCurrency } from "@/components/currency-provider";
import { productCopy } from "@/lib/catalog";
import { isRemoteImage } from "@/lib/store-mapping";

export function ProductDetails({ product, commerceEnabled }: { product: Product; commerceEnabled: boolean }) {
  const { t, lang } = useLanguage();
  const { formatPrice } = useCurrency();
  const [activeImage, setActiveImage] = useState(0);
  const mainImage = product.images[activeImage] ?? product.images[0];
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
          <div className="product-detail-image">
            {mainImage && (
              <Image
                key={mainImage}
                src={mainImage}
                unoptimized={isRemoteImage(mainImage)}
                alt={activeImage === 0 ? t.productPhotoAlt(product.name) : t.productViewAlt(product.name, activeImage + 1)}
                fill
                loading="eager"
                sizes="(max-width: 767px) 100vw, 560px"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="product-thumbs">
              {product.images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  className="product-thumb"
                  aria-label={index === 0 ? t.productPhotoAlt(product.name) : t.productViewAlt(product.name, index + 1)}
                  aria-pressed={index === activeImage}
                  onClick={() => setActiveImage(index)}
                >
                  <Image src={src} unoptimized={isRemoteImage(src)} alt="" fill sizes="88px" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-detail-copy">
          {category && <span className="product-category">{category}</span>}
          <h1>{product.name}</h1>
          <p className="product-price">{commerceEnabled ? formatPrice(product.price, product.currency) : t.shopPriceAnnounced}</p>
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
