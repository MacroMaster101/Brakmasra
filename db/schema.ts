import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"admin" | "editor" | "support">().notNull(),
  mfaSecretEncrypted: text("mfa_secret_encrypted"),
  ...timestamps(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  currency: char("currency", { length: 3 }).notNull().default("LKR"),
  priceMinor: integer("price_minor").notNull(),
  fabric: text("fabric"),
  care: jsonb("care").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  status: text("status").$type<"draft" | "active" | "archived">().notNull().default("draft"),
  category: text("category").$type<"Apparel" | "Headwear">(),
  badge: text("badge").$type<"NEW" | "LIMITED" | "BEST SELLER" | "SALE">(),
  comingSoon: boolean("coming_soon").notNull().default(false),
  position: integer("position").notNull().default(0),
  siDescription: text("si_description"),
  siFabric: text("si_fabric"),
  siCare: jsonb("si_care").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  ...timestamps(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  size: text("size"),
  color: text("color"),
  inventory: integer("inventory").notNull().default(0),
  priceMinor: integer("price_minor"),
  active: boolean("active").notNull().default(true),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text").notNull(),
  position: integer("position").notNull().default(0),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(false),
});

export const collectionProducts = pgTable(
  "collection_products",
  {
    collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.productId] })],
);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id").notNull().unique(),
  status: text("status").$type<"pending" | "paid" | "fulfilled" | "cancelled" | "refunded">().notNull(),
  currency: char("currency", { length: 3 }).notNull(),
  subtotalMinor: integer("subtotal_minor").notNull(),
  shippingMinor: integer("shipping_minor").notNull().default(0),
  taxMinor: integer("tax_minor").notNull().default(0),
  totalMinor: integer("total_minor").notNull(),
  customerEmail: text("customer_email").notNull(),
  shippingAddress: jsonb("shipping_address").$type<Record<string, unknown>>(),
  paymentProvider: text("payment_provider"),
  paymentSessionId: text("payment_session_id").unique(),
  trackingNumber: text("tracking_number"),
  adminNote: text("admin_note"),
  ...timestamps(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  variantId: uuid("variant_id").notNull().references(() => productVariants.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label"),
  quantity: integer("quantity").notNull(),
  unitPriceMinor: integer("unit_price_minor").notNull(),
});

export const discounts = pgTable("discounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  kind: text("kind").$type<"percent" | "fixed">().notNull(),
  value: integer("value").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  usageLimit: integer("usage_limit"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
  status: text("status").$type<"pending" | "active" | "unsubscribed">().notNull().default("pending"),
  source: text("source").notNull().default("website"),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  status: text("status").$type<"new" | "read" | "resolved" | "spam">().notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const socialLinks = pgTable("social_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull().unique(),
  url: text("url").notNull(),
  label: text("label"),
  verified: boolean("verified").notNull().default(false),
  visible: boolean("visible").notNull().default(false),
});

export const featuredContent = pgTable("featured_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").$type<"video" | "playlist" | "product" | "collection">().notNull(),
  referenceId: text("reference_id").notNull(),
  position: integer("position").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("rate_limits_reset_at_idx").on(table.resetAt)],
);
