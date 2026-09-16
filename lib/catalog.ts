import { products as catalog, type Product } from "@/data/products";
import type { CartLine } from "@/lib/cart";

export const MAX_LINE_QUANTITY = 10;

export function findProduct(slug: string, list: Product[] = catalog): Product | undefined {
  return list.find((product) => product.slug === slug);
}

export function searchProducts(query: string, list: Product[] = catalog): Product[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(needle));
}

export type VariantChoice = { size: string; color: string; quantity: number };

/** Builds a cart line only for a real, photographed, in-stock variant; otherwise null. */
export function toCartLine(product: Product, choice: VariantChoice): CartLine | null {
  const sizeOk = product.sizes.length ? product.sizes.includes(choice.size) : choice.size === "";
  const colorOk = product.colors.length ? product.colors.includes(choice.color) : choice.color === "";
  const maxQuantity = Math.min(MAX_LINE_QUANTITY, product.stock);
  const quantityOk = Number.isInteger(choice.quantity) && choice.quantity >= 1 && choice.quantity <= maxQuantity;
  const image = product.images[0];
  if (!sizeOk || !colorOk || !quantityOk || !image) return null;

  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image,
    size: choice.size,
    color: choice.color,
    quantity: choice.quantity,
    unitPrice: product.price,
    currency: product.currency,
  };
}
