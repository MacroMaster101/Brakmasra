import { z } from "zod";

import { ORDER_STATUS_VALUES } from "@/lib/order-status";

// Pure rules for the Control Room store forms, shared by the forms, the server
// actions, and the tests. Client-safe: no server imports.

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export const PRODUCT_CATEGORIES = ["Apparel", "Headwear"] as const;
export const PRODUCT_BADGES = ["NEW", "LIMITED", "BEST SELLER", "SALE"] as const;
export const DISCOUNT_KINDS = ["percent", "fixed"] as const;
export type DiscountKind = (typeof DISCOUNT_KINDS)[number];

export const MAX_SIZES = 12;
export const MAX_COLORS = 12;
export const MAX_STOCK = 100_000;
export const MAX_PRODUCT_IMAGES = 8;
const MAX_PRICE_MINOR = 100_000_000; // LKR 1,000,000.00

const invalid = "Check the form and try again.";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lower-case words joined by hyphens, as used in /shop/<slug>. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** "6,900.50" or "6900" in rupees to cents; null when it isn't a valid amount. */
export function parseMoney(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(cleaned)) return null;
  const minor = Math.round(Number(cleaned) * 100);
  return minor <= MAX_PRICE_MINOR ? minor : null;
}

export function formatMoneyInput(minor: number) {
  return (minor / 100).toFixed(2).replace(/\.00$/, "");
}

/** A comma-separated list, trimmed, without blanks or repeats (case-insensitive). */
export function parseList(value: string) {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const raw of value.split(",")) {
    const item = raw.trim().replace(/\s+/g, " ");
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    items.push(item);
  }
  return items;
}

/** One line per entry, trimmed, blanks dropped. */
export function parseLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

/** The form field name that holds stock for one size and colour. */
export function stockField(size: string, color: string) {
  return `stock:${size}|${color}`;
}

/** Every size and colour pairing; a missing axis counts as one blank option. */
export function variantCombos(sizes: string[], colors: string[]) {
  const sizeAxis = sizes.length ? sizes : [""];
  const colorAxis = colors.length ? colors : [""];
  return sizeAxis.flatMap((size) => colorAxis.map((color) => ({ size, color })));
}

const optionalText = (max: number) => z.string().trim().max(max, invalid).transform((value) => value || null);
const lines = (maxLines: number, maxLength: number) =>
  z.string().max(maxLines * (maxLength + 2), invalid).transform(parseLines)
    .refine((items) => items.length <= maxLines && items.every((item) => item.length <= maxLength), invalid);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a product name.").max(120, "Keep the name under 120 characters."),
    slug: z.string().trim().toLowerCase().regex(slugPattern, "Use lower-case letters, numbers, and hyphens for the web address.").max(80, invalid),
    status: z.enum(PRODUCT_STATUSES, { message: invalid }),
    category: z.enum(["", ...PRODUCT_CATEGORIES], { message: invalid }).transform((value) => value || null),
    badge: z.enum(["", ...PRODUCT_BADGES], { message: invalid }).transform((value) => value || null),
    comingSoon: z.boolean(),
    position: z.coerce.number({ message: invalid }).int(invalid).min(0, invalid).max(9999, invalid),
    price: z.string().transform((value, context) => {
      const minor = parseMoney(value);
      if (minor === null) {
        context.addIssue({ code: "custom", message: "Enter a price in rupees, like 6900 or 6900.50." });
        return z.NEVER;
      }
      return minor;
    }),
    description: z.string().trim().min(10, "Write a short description.").max(2000, "Keep the description under 2,000 characters."),
    fabric: optionalText(200),
    care: lines(8, 120),
    siDescription: optionalText(2000),
    siFabric: optionalText(200),
    siCare: lines(8, 160),
    sizes: z.string().max(400, invalid).transform(parseList)
      .refine((items) => items.length <= MAX_SIZES && items.every((item) => item.length <= 16), "Use up to 12 sizes, each under 16 characters."),
    colors: z.string().max(600, invalid).transform(parseList)
      .refine((items) => items.length <= MAX_COLORS && items.every((item) => item.length <= 40), "Use up to 12 colours, each under 40 characters."),
    stock: z.record(z.string(), z.coerce.number({ message: invalid }).int(invalid).min(0, invalid).max(MAX_STOCK, invalid)),
  })
  .transform((product) => ({
    ...product,
    variants: variantCombos(product.sizes, product.colors).map((combo) => ({
      ...combo,
      inventory: product.stock[stockField(combo.size, combo.color)] ?? 0,
    })),
  }));
export type ProductInput = z.output<typeof productSchema>;

/** Reads the product form, including one stock box per size and colour. */
export function productFormValues(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const stock: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("stock:") && typeof value === "string") stock[key] = value || "0";
  }
  return {
    name: text("name"),
    slug: text("slug") || slugify(text("name")),
    status: text("status"),
    category: text("category"),
    badge: text("badge"),
    comingSoon: formData.get("comingSoon") === "on",
    position: text("position") || "0",
    price: text("price"),
    description: text("description"),
    fabric: text("fabric"),
    care: text("care"),
    siDescription: text("siDescription"),
    siFabric: text("siFabric"),
    siCare: text("siCare"),
    sizes: text("sizes"),
    colors: text("colors"),
    stock,
  };
}

export const collectionSchema = z.object({
  name: z.string().trim().min(2, "Enter a collection name.").max(80, "Keep the name under 80 characters."),
  slug: z.string().trim().toLowerCase().regex(slugPattern, "Use lower-case letters, numbers, and hyphens for the web address.").max(80, invalid),
  description: optionalText(500),
  active: z.boolean(),
  productIds: z.array(z.string().uuid(invalid)).max(200, invalid)
    .transform((ids) => [...new Set(ids)]),
});
export type CollectionInput = z.output<typeof collectionSchema>;

/** `datetime-local` value, read as Sri Lanka time (UTC+05:30), to ISO; blank stays null. */
export function localDateTimeToIso(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return undefined;
  const date = new Date(`${trimmed}:00+05:30`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** ISO time to a `datetime-local` value in Sri Lanka time. */
export function isoToLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + 5.5 * 60 * 60_000).toISOString().slice(0, 16);
}

const dateField = z.string().transform((value, context) => {
  const iso = localDateTimeToIso(value);
  if (iso === undefined) {
    context.addIssue({ code: "custom", message: invalid });
    return z.NEVER;
  }
  return iso;
});

export const discountSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, "Use 3 to 32 letters, numbers, hyphens, or underscores for the code."),
    kind: z.enum(DISCOUNT_KINDS, { message: invalid }),
    value: z.string(),
    startsAt: dateField,
    endsAt: dateField,
    usageLimit: z.string().trim().transform((value, context) => {
      if (!value) return null;
      const limit = Number(value);
      if (!Number.isInteger(limit) || limit < 1 || limit > 1_000_000) {
        context.addIssue({ code: "custom", message: "Enter a usage limit between 1 and 1,000,000, or leave it blank." });
        return z.NEVER;
      }
      return limit;
    }),
    active: z.boolean(),
  })
  .transform((discount, context) => {
    let value: number | null;
    if (discount.kind === "percent") {
      const percent = Number(discount.value.trim());
      value = Number.isInteger(percent) && percent >= 1 && percent <= 100 ? percent : null;
      if (value === null) context.addIssue({ code: "custom", message: "Enter a percentage from 1 to 100.", path: ["value"] });
    } else {
      value = parseMoney(discount.value);
      if (!value) context.addIssue({ code: "custom", message: "Enter an amount in rupees, like 500.", path: ["value"] });
    }
    if (discount.startsAt && discount.endsAt && discount.endsAt <= discount.startsAt) {
      context.addIssue({ code: "custom", message: "The end date must be after the start date.", path: ["endsAt"] });
    }
    return { ...discount, value: value ?? 0 };
  });
export type DiscountInput = z.output<typeof discountSchema>;

export const orderUpdateSchema = z.object({
  publicId: z.string().trim().min(1, invalid).max(64, invalid),
  status: z.enum(ORDER_STATUS_VALUES, { message: invalid }),
  trackingNumber: optionalText(100),
  adminNote: optionalText(1000),
});

export const idSchema = z.object({ id: z.string().uuid(invalid) });

export const imageMoveSchema = z.object({
  id: z.string().uuid(invalid),
  direction: z.enum(["up", "down"], { message: invalid }),
});

export const imageAltSchema = z.object({
  id: z.string().uuid(invalid),
  altText: z.string().trim().min(2, "Describe the photo in a few words.").max(160, "Keep the description under 160 characters."),
});

/** Cells a spreadsheet would run as a formula get a leading apostrophe. */
export function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
