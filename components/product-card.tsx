"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Eye, Heart, X } from "lucide-react";
import { useId, useRef } from "react";
import type { Product } from "@/data/products";
import { useCurrency } from "@/components/currency-provider";
import { productCopy } from "@/lib/catalog";
import { useLanguage } from "@/components/language-provider";
import { isRemoteImage } from "@/lib/store-mapping";
import { useWishlist } from "@/lib/wishlist";

type ProductCardProps = {
  className?: string;
  commerceEnabled: boolean;
  priority?: boolean;
  product: Product;
  sizes?: string;
};

export function ProductCard({
  product,
  commerceEnabled,
  className = "",
  priority = false,
  sizes = "(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 340px",
}: ProductCardProps) {
  const { t, lang } = useLanguage();
  const { formatPrice } = useCurrency();
  const { slugs, toggle } = useWishlist();
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const saved = slugs.includes(product.slug);
  const image = product.images[0];
  const soldOut = product.stock <= 0;
  const badge = soldOut
    ? t.shopSoldOut
    : product.badge === "NEW"
      ? t.shopBadgeNew
      : product.badge === "LIMITED"
        ? t.shopBadgeLimited
        : product.badge === "BEST SELLER"
          ? t.shopBadgeBestSeller
          : product.badge === "SALE"
            ? t.shopBadgeSale
            : null;
  const price = commerceEnabled
    ? formatPrice(product.price, product.currency)
    : t.shopComingSoon;
  return (
    <article className={`product-card ${className}`}>
      <div className="product-card-image">
        <Link
          className="product-photo-link"
          href={`/shop/${product.slug}`}
          aria-label={product.name}
        >
          {image && (
            <Image
              src={image}
              unoptimized={isRemoteImage(image)}
              alt={t.productPhotoAlt(product.name)}
              fill
              loading={priority ? "eager" : "lazy"}
              sizes={sizes}
            />
          )}
          {product.images[1] && (
            <Image
              className="product-hover-image"
              src={product.images[1]}
              unoptimized={isRemoteImage(product.images[1])}
              alt=""
              fill
              sizes={sizes}
            />
          )}
        </Link>
        {badge && (
          <span className={`product-badge${soldOut ? " is-sold-out" : ""}`}>
            {badge}
          </span>
        )}
        <button
          type="button"
          className={`product-save icon-button${saved ? " is-saved" : ""}`}
          aria-label={`${saved ? t.storeUnsave : t.storeSave}: ${product.name}`}
          title={saved ? t.storeUnsave : t.storeSave}
          aria-pressed={saved}
          onClick={() => toggle(product.slug)}
        >
          <Heart />
        </button>
        <button
          type="button"
          className="product-quick-view"
          onClick={() => dialog.current?.showModal()}
          aria-label={`${t.storeQuickView}: ${product.name}`}
        >
          <Eye />
          {t.storeQuickView}
        </button>
      </div>
      <div className="product-card-info">
        <Link href={`/shop/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="product-card-price">{price}</p>
        <div className="product-card-variants">
          <span
            className={`color-swatch ${product.colors[0]?.toLowerCase().includes("white") ? "swatch-white" : "swatch-black"}`}
            title={product.colors.join(", ")}
          />
          <span>{product.sizes.join(" / ")}</span>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="store-dialog quick-view-dialog"
        aria-labelledby={headingId}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <button
          type="button"
          className="icon-button dialog-close"
          aria-label={t.storeClose}
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        <div className="quick-view-grid">
          <div className="quick-view-photo">
            {image && (
              <Image
                src={image}
                unoptimized={isRemoteImage(image)}
                alt={t.productPhotoAlt(product.name)}
                fill
                sizes="(max-width: 767px) 90vw, 420px"
              />
            )}
          </div>
          <div className="quick-view-copy">
            <h2 id={headingId}>{product.name}</h2>
            <p className="product-price">{price}</p>
            <p>{productCopy(product, lang).description}</p>
            <div className="quick-view-sizes">
              {product.sizes.map((size) => (
                <span key={size}>{size}</span>
              ))}
            </div>
            <Link
              className="button button-primary"
              href={`/shop/${product.slug}`}
              onClick={() => dialog.current?.close()}
            >
              {t.storeViewDetails}
              <ArrowUpRight />
            </Link>
          </div>
        </div>
      </dialog>
    </article>
  );
}
