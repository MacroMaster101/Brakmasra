import type { Product, ProductCategory } from "@/data/products";

// Turns database rows into the storefront's Product shape. Pure, so it is tested
// without a database.

export const PRODUCT_IMAGE_BUCKET = "product-images";

export type VariantRow = { size: string | null; color: string | null; inventory: number | null; active: boolean | null };
export type ImageRow = { url: string; alt_text: string | null; position: number | null };
export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  currency: string;
  price_minor: number;
  fabric: string | null;
  care: unknown;
  category: string | null;
  badge: string | null;
  coming_soon: boolean | null;
  si_description: string | null;
  si_fabric: string | null;
  si_care: unknown;
  product_variants?: VariantRow[] | null;
  product_images?: ImageRow[] | null;
};

const BADGES = ["NEW", "LIMITED", "BEST SELLER", "SALE"] as const;

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
}

function unique(values: (string | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))];
}

/**
 * Only photos this site stores are shown: files shipped in /images, or the
 * product photo bucket in this project's Supabase storage.
 */
export function isAllowedProductImage(url: string, supabaseUrl: string | undefined) {
  if (url.startsWith("/images/") && !url.includes("..")) return true;
  if (!supabaseUrl) return false;
  try {
    const origin = new URL(supabaseUrl).origin;
    const parsed = new URL(url);
    return parsed.origin === origin && parsed.pathname.startsWith(`/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`);
  } catch {
    return false;
  }
}

/** Remote photos are already resized WebP; Next only optimizes files it serves. */
export function isRemoteImage(src: string) {
  return /^https?:\/\//.test(src);
}

export function productFromRow(row: ProductRow, supabaseUrl: string | undefined): Product {
  const variants = (row.product_variants ?? []).filter((variant) => variant.active !== false);
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((image) => image.url)
    .filter((url) => isAllowedProductImage(url, supabaseUrl));
  const siDescription = row.si_description?.trim();
  const badge = BADGES.find((value) => value === row.badge);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price_minor,
    currency: row.currency.trim().toUpperCase(),
    images,
    sizes: unique(variants.map((variant) => variant.size)),
    colors: unique(variants.map((variant) => variant.color)),
    fabric: row.fabric ?? "",
    care: strings(row.care),
    stock: variants.reduce((total, variant) => total + Math.max(0, variant.inventory ?? 0), 0),
    category: row.category === "Apparel" || row.category === "Headwear" ? (row.category as ProductCategory) : undefined,
    badge,
    preview: row.coming_soon === true,
    si: siDescription
      ? { description: siDescription, fabric: row.si_fabric?.trim() || row.fabric || "", care: strings(row.si_care) }
      : undefined,
  };
}
