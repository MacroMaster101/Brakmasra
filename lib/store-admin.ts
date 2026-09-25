import "server-only";

import type { DiscountKind, ProductStatus } from "@/lib/store-admin-validation";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { PRODUCT_SELECT } from "@/lib/store";
import { isAllowedProductImage } from "@/lib/store-mapping";
import { getSupabaseServerClient } from "@/lib/supabase";

// Control Room reads for the shop. Every table has RLS with no policies, so only
// the service role reads them. Callers check the viewer's permission first.
// Each loader returns null when the data could not be loaded.

export type AdminVariant = { id: string; sku: string; size: string; color: string; inventory: number; active: boolean };
export type AdminImage = { id: string; url: string; altText: string; position: number };

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  currency: string;
  priceMinor: number;
  fabric: string;
  care: string[];
  category: string;
  badge: string;
  comingSoon: boolean;
  position: number;
  status: ProductStatus;
  siDescription: string;
  siFabric: string;
  siCare: string[];
  updatedAt: string;
  variants: AdminVariant[];
  images: AdminImage[];
};

export type AdminProductSummary = Pick<AdminProduct, "id" | "slug" | "name" | "status" | "priceMinor" | "currency" | "comingSoon" | "updatedAt"> & {
  stock: number;
  image: string | null;
};

export type AdminCollection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
  productIds: string[];
};

export type AdminDiscount = {
  id: string;
  code: string;
  kind: DiscountKind;
  value: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  active: boolean;
};

export type AdminOrderItem = { id: string; productName: string; variantLabel: string; quantity: number; unitPriceMinor: number };
export type AdminOrderDetail = {
  id: string;
  publicId: string;
  status: OrderStatus;
  currency: string;
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  customerEmail: string;
  shippingAddress: { label: string; value: string }[];
  paymentProvider: string;
  trackingNumber: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
};

type Row = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function status(value: unknown): ProductStatus {
  return value === "active" || value === "archived" ? value : "draft";
}

function adminProduct(row: Row): AdminProduct {
  const variants = (Array.isArray(row.product_variants) ? row.product_variants : []) as Row[];
  const images = (Array.isArray(row.product_images) ? row.product_images : []) as Row[];
  return {
    id: text(row.id),
    slug: text(row.slug),
    name: text(row.name),
    description: text(row.description),
    currency: text(row.currency).trim().toUpperCase() || "LKR",
    priceMinor: num(row.price_minor),
    fabric: text(row.fabric),
    care: strings(row.care),
    category: text(row.category),
    badge: text(row.badge),
    comingSoon: row.coming_soon === true,
    position: num(row.position),
    status: status(row.status),
    siDescription: text(row.si_description),
    siFabric: text(row.si_fabric),
    siCare: strings(row.si_care),
    updatedAt: text(row.updated_at),
    variants: variants.map((variant) => ({
      id: text(variant.id),
      sku: text(variant.sku),
      size: text(variant.size),
      color: text(variant.color),
      inventory: num(variant.inventory),
      active: variant.active !== false,
    })),
    images: images
      .map((image) => ({ id: text(image.id), url: text(image.url), altText: text(image.alt_text), position: num(image.position) }))
      .filter((image) => isAllowedProductImage(image.url, process.env.SUPABASE_URL))
      .sort((a, b) => a.position - b.position),
  };
}

export async function listAdminProducts(): Promise<AdminProductSummary[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("status", { ascending: true })
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(300);
    if (error || !data) return null;
    return (data as unknown as Row[]).map(adminProduct).map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      status: product.status,
      priceMinor: product.priceMinor,
      currency: product.currency,
      comingSoon: product.comingSoon,
      updatedAt: product.updatedAt,
      stock: product.variants.filter((variant) => variant.active).reduce((total, variant) => total + variant.inventory, 0),
      image: product.images[0]?.url ?? null,
    }));
  } catch {
    return null;
  }
}

/** The product, "missing" when there is no such product, or null on a load error. */
export async function getAdminProduct(id: string): Promise<AdminProduct | "missing" | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
    if (error) return null;
    return data ? adminProduct(data as unknown as Row) : "missing";
  } catch {
    return null;
  }
}

/** Every product's id, name, and status, for picking collection members. */
export async function listProductChoices(): Promise<{ id: string; name: string; status: ProductStatus }[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("products").select("id, name, status").order("name").limit(300);
    if (error || !data) return null;
    return (data as Row[]).map((row) => ({ id: text(row.id), name: text(row.name), status: status(row.status) }));
  } catch {
    return null;
  }
}

function adminCollection(row: Row): AdminCollection {
  const links = (Array.isArray(row.collection_products) ? row.collection_products : []) as Row[];
  return {
    id: text(row.id),
    slug: text(row.slug),
    name: text(row.name),
    description: text(row.description),
    active: row.active === true,
    productIds: links.sort((a, b) => num(a.position) - num(b.position)).map((link) => text(link.product_id)),
  };
}

const COLLECTION_SELECT = "id, slug, name, description, active, collection_products(product_id, position)";

export async function listAdminCollections(): Promise<AdminCollection[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("collections").select(COLLECTION_SELECT).order("name").limit(200);
    if (error || !data) return null;
    return (data as Row[]).map(adminCollection);
  } catch {
    return null;
  }
}

export async function getAdminCollection(id: string): Promise<AdminCollection | "missing" | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("collections").select(COLLECTION_SELECT).eq("id", id).maybeSingle();
    if (error) return null;
    return data ? adminCollection(data as Row) : "missing";
  } catch {
    return null;
  }
}

function adminDiscount(row: Row): AdminDiscount {
  return {
    id: text(row.id),
    code: text(row.code),
    kind: row.kind === "fixed" ? "fixed" : "percent",
    value: num(row.value),
    startsAt: text(row.starts_at) || null,
    endsAt: text(row.ends_at) || null,
    usageLimit: row.usage_limit === null || row.usage_limit === undefined ? null : num(row.usage_limit),
    active: row.active === true,
  };
}

const DISCOUNT_SELECT = "id, code, kind, value, starts_at, ends_at, usage_limit, active";

export async function listAdminDiscounts(): Promise<AdminDiscount[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("discounts").select(DISCOUNT_SELECT).order("code").limit(300);
    if (error || !data) return null;
    return (data as Row[]).map(adminDiscount);
  } catch {
    return null;
  }
}

export async function getAdminDiscount(id: string): Promise<AdminDiscount | "missing" | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("discounts").select(DISCOUNT_SELECT).eq("id", id).maybeSingle();
    if (error) return null;
    return data ? adminDiscount(data as Row) : "missing";
  } catch {
    return null;
  }
}

/** Shipping address fields shown in a fixed order; anything else is listed after. */
const ADDRESS_ORDER = ["name", "phone", "line1", "line2", "city", "district", "postal_code", "country"];

function addressLines(value: unknown): { label: string; value: string }[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const entries = Object.entries(value as Row).filter(([, field]) => typeof field === "string" || typeof field === "number");
  entries.sort(([a], [b]) => {
    const rank = (key: string) => (ADDRESS_ORDER.includes(key) ? ADDRESS_ORDER.indexOf(key) : ADDRESS_ORDER.length);
    return rank(a) - rank(b);
  });
  return entries.slice(0, 20).map(([label, field]) => ({ label, value: String(field).slice(0, 300) }));
}

export async function getAdminOrder(publicId: string): Promise<AdminOrderDetail | "missing" | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, public_id, status, currency, subtotal_minor, shipping_minor, tax_minor, total_minor, customer_email, shipping_address, payment_provider, tracking_number, admin_note, created_at, updated_at, order_items(id, product_name, variant_label, quantity, unit_price_minor)")
      .eq("public_id", publicId)
      .maybeSingle();
    if (error) return null;
    if (!data) return "missing";
    const row = data as Row;
    const items = (Array.isArray(row.order_items) ? row.order_items : []) as Row[];
    const orderStatus = ORDER_STATUSES.find((value) => value === row.status) ?? "pending";
    return {
      id: text(row.id),
      publicId: text(row.public_id),
      status: orderStatus,
      currency: text(row.currency).trim().toUpperCase(),
      subtotalMinor: num(row.subtotal_minor),
      shippingMinor: num(row.shipping_minor),
      taxMinor: num(row.tax_minor),
      totalMinor: num(row.total_minor),
      customerEmail: text(row.customer_email),
      shippingAddress: addressLines(row.shipping_address),
      paymentProvider: text(row.payment_provider),
      trackingNumber: text(row.tracking_number),
      adminNote: text(row.admin_note),
      createdAt: text(row.created_at),
      updatedAt: text(row.updated_at),
      items: items.map((item) => ({
        id: text(item.id),
        productName: text(item.product_name),
        variantLabel: text(item.variant_label),
        quantity: num(item.quantity),
        unitPriceMinor: num(item.unit_price_minor),
      })),
    };
  } catch {
    return null;
  }
}
