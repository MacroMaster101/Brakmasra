import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/cart";

type ProductCardProps = {
  className?: string;
  commerceEnabled: boolean;
  priority?: boolean;
  product: Product;
};

export function ProductCard({ product, commerceEnabled, className = "", priority = false }: ProductCardProps) {
  const image = product.images[0];
  const soldOut = product.stock <= 0;
  return <Link href={`/shop/${product.slug}`} className={`product-card ${className}`}>
    <div className="product-card-image">
      {image && <Image src={image} alt={`${product.name} product photo`} fill loading={priority ? "eager" : "lazy"} sizes="(max-width: 767px) 100vw, 50vw" />}
    </div>
    <div className="product-card-info"><div>{(soldOut || product.badge) && <span className="product-badge">{soldOut ? "Sold out" : product.badge}</span>}<h3>{product.name}</h3><span>{product.category}</span></div><p>{commerceEnabled ? formatMoney(product.price, product.currency) : "Coming soon"}</p></div>
  </Link>;
}
