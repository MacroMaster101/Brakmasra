"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/cart";
import { useLanguage } from "@/components/language-provider";

type ProductCardProps = {
  className?: string;
  commerceEnabled: boolean;
  priority?: boolean;
  product: Product;
};

export function ProductCard({ product, commerceEnabled, className = "", priority = false }: ProductCardProps) {
  const { t } = useLanguage();
  const image = product.images[0];
  const soldOut = product.stock <= 0;

  const getBadgeLabel = () => {
    if (soldOut) return t.shopSoldOut;
    if (product.badge === "NEW") return t.shopBadgeNew;
    if (product.badge === "LIMITED") return t.shopBadgeLimited;
    if (product.badge === "BEST SELLER") return t.shopBadgeBestSeller;
    if (product.badge === "SALE") return t.shopBadgeSale;
    return product.badge;
  };

  const getCategoryLabel = () => {
    if (product.category === "Apparel") return t.shopFilterApparel;
    if (product.category === "Headwear") return t.shopFilterHeadwear;
    return product.category;
  };

  return (
    <Link href={`/shop/${product.slug}`} className={`product-card ${className}`}>
      <div className="product-card-image">
        {image && (
          <Image
            src={image}
            alt={`${product.name} product photo`}
            fill
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 33vw"
          />
        )}
      </div>
      <div className="product-card-info">
        <div>
          {(soldOut || product.badge) && (
            <span className="product-badge">{getBadgeLabel()}</span>
          )}
          <h3>{product.name}</h3>
          <span>{getCategoryLabel()}</span>
        </div>
        <p>
          {commerceEnabled
            ? formatMoney(product.price, product.currency)
            : t.shopComingSoon}
        </p>
      </div>
    </Link>
  );
}
