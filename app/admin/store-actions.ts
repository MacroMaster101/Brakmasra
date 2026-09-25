"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";

import { audit, controlRoomLimit, viewerWith } from "@/app/admin/action-helpers";
import type { ControlRoomActionState } from "@/app/admin/actions";
import { firstIssue, formText } from "@/lib/account-validation";
import { AVATAR_UPLOAD_MAX_BYTES, detectImageType } from "@/lib/avatar";
import { products as starterProducts } from "@/data/products";
import { authDemoMode } from "@/lib/features";
import type { Member } from "@/lib/member";
import type { Permission } from "@/lib/roles";
import { CATALOG_TAG } from "@/lib/store";
import {
  collectionSchema,
  discountSchema,
  idSchema,
  imageAltSchema,
  imageMoveSchema,
  MAX_PRODUCT_IMAGES,
  orderUpdateSchema,
  productFormValues,
  productSchema,
  type ProductInput,
  variantCombos,
} from "@/lib/store-admin-validation";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/store-mapping";
import { getSupabaseServerClient } from "@/lib/supabase";

type Admin = NonNullable<ReturnType<typeof getSupabaseServerClient>>;
type Guarded = { viewer: Member; supabase: Admin } | { error: ControlRoomActionState };

// One reply for every access failure, so a probe learns nothing about roles.
const notAvailable: ControlRoomActionState = { status: "error", message: "This action is not available." };
const demoSaved: ControlRoomActionState = { status: "success", message: "Preview mode. Changes are not saved." };
const tooManyAttempts: ControlRoomActionState = { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
const notConfigured: ControlRoomActionState = { status: "error", message: "Control Room data is not connected yet." };
const notSaved: ControlRoomActionState = { status: "error", message: "The changes could not be saved. Please try again." };

const PHOTO_SIZE = 1600;

/** Checks the viewer's role, demo mode, the rate limit, and the database, in that order. */
async function guard(permission: Permission, scope: string, limit = 60): Promise<Guarded> {
  const viewer = await viewerWith(permission);
  if (!viewer) return { error: notAvailable };
  if (authDemoMode) return { error: demoSaved };
  const attempt = await controlRoomLimit(scope, limit, 10 * 60_000, viewer.id);
  if (!attempt.allowed) return { error: tooManyAttempts };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { error: notConfigured };
  return { viewer, supabase };
}

/** Postgres unique-violation code, as Supabase reports it. */
function isDuplicate(error: { code?: string } | null) {
  return error?.code === "23505";
}

/** Shop pages read the cached catalog; expire it after every product change. */
function refreshStore() {
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}

function sku(slug: string, size: string, color: string) {
  const part = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 12);
  return [part(slug).slice(0, 20), part(size), part(color), randomBytes(2).toString("hex").toUpperCase()].filter(Boolean).join("-");
}

function productRow(input: ProductInput) {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    price_minor: input.price,
    fabric: input.fabric,
    care: input.care,
    status: input.status,
    category: input.category,
    badge: input.badge,
    coming_soon: input.comingSoon,
    position: input.position,
    si_description: input.siDescription,
    si_fabric: input.siFabric,
    si_care: input.siCare,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Makes the product's variants match the stock grid: existing size and colour
 * pairs are updated (and switched back on), new ones are added, and removed
 * ones are deleted, or only switched off when an order still points at them.
 */
async function syncVariants(supabase: Admin, productId: string, slug: string, wanted: ProductInput["variants"]) {
  const { data: existing, error } = await supabase
    .from("product_variants")
    .select("id, size, color")
    .eq("product_id", productId);
  if (error) return false;

  const key = (size: string | null, color: string | null) => `${size ?? ""}\u0000${color ?? ""}`;
  const current = new Map((existing ?? []).map((row) => [key(row.size, row.color), row.id as string]));
  const wantedKeys = new Set(wanted.map((variant) => key(variant.size, variant.color)));

  for (const variant of wanted) {
    const id = current.get(key(variant.size, variant.color));
    const fields = { size: variant.size || null, color: variant.color || null, inventory: variant.inventory, active: true };
    const result = id
      ? await supabase.from("product_variants").update(fields).eq("id", id)
      : await supabase.from("product_variants").insert({ ...fields, product_id: productId, sku: sku(slug, variant.size, variant.color) });
    if (result.error) return false;
  }

  for (const [variantKey, id] of current) {
    if (wantedKeys.has(variantKey)) continue;
    const removed = await supabase.from("product_variants").delete().eq("id", id);
    if (removed.error) {
      // Still referenced by an order: keep the record, stop selling it.
      const hidden = await supabase.from("product_variants").update({ active: false, inventory: 0 }).eq("id", id);
      if (hidden.error) return false;
    }
  }
  return true;
}

export async function saveProductAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "product-save");
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const idValue = formText(formData.get("id"));
  const id = idValue ? idSchema.safeParse({ id: idValue }) : null;
  if (id && !id.success) return { status: "error", message: firstIssue(id) };

  const parsed = productSchema.safeParse(productFormValues(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  const input = parsed.data;

  let productId = id?.data.id ?? "";
  try {
    const row = productRow(input);
    const result = productId
      ? await supabase.from("products").update(row).eq("id", productId).select("id").maybeSingle()
      : await supabase.from("products").insert({ ...row, currency: "LKR" }).select("id").single();
    if (isDuplicate(result.error)) return { status: "error", message: "Another product already uses that web address." };
    if (result.error) return notSaved;
    if (!result.data) return { status: "error", message: "That product no longer exists." };
    productId = String(result.data.id);

    if (!(await syncVariants(supabase, productId, input.slug, input.variants))) return notSaved;
  } catch {
    return notSaved;
  }

  await audit(viewer, id ? "product.update" : "product.create", "product", productId, { slug: input.slug, status: input.status });
  refreshStore();
  revalidatePath("/admin/products");
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  return { status: "success", message: "Product saved." };
}

export async function deleteProductAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "product-delete", 20);
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const parsed = idSchema.safeParse({ id: formText(formData.get("id")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  const productId = parsed.data.id;

  try {
    const { data: variants, error: variantError } = await supabase.from("product_variants").select("id").eq("product_id", productId);
    if (variantError) return notSaved;
    const variantIds = (variants ?? []).map((variant) => variant.id as string);
    if (variantIds.length) {
      const { count, error } = await supabase
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .in("variant_id", variantIds);
      if (error) return notSaved;
      if (count) return { status: "error", message: "This product has orders, so it can't be deleted. Archive it instead." };
    }

    const { data: photos } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).list(productId, { limit: 100 });
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) return notSaved;
    const paths = (photos ?? []).map((photo) => `${productId}/${photo.name}`);
    if (paths.length) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
  } catch {
    return notSaved;
  }

  await audit(viewer, "product.delete", "product", productId);
  refreshStore();
  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
}

/** Copies the built-in launch collection into the database, once. */
export async function importStarterProductsAction(): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "product-import", 5);
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  try {
    const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true });
    if (error) return notSaved;
    if (count) return { status: "error", message: "Products already exist, so nothing was imported." };

    for (const [index, product] of starterProducts.entries()) {
      const inserted = await supabase.from("products").insert({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        currency: product.currency,
        price_minor: product.price,
        fabric: product.fabric || null,
        care: product.care,
        status: "active",
        category: product.category ?? null,
        badge: product.badge ?? null,
        coming_soon: product.preview === true,
        position: index,
        si_description: product.si?.description ?? null,
        si_fabric: product.si?.fabric ?? null,
        si_care: product.si?.care ?? [],
      });
      if (inserted.error) return notSaved;

      // Spread the listed stock across every size and colour.
      const combos = variantCombos(product.sizes, product.colors);
      const each = Math.floor(product.stock / combos.length);
      const variants = combos.map((combo, comboIndex) => ({
        product_id: product.id,
        sku: sku(product.slug, combo.size, combo.color),
        size: combo.size || null,
        color: combo.color || null,
        inventory: each + (comboIndex < product.stock % combos.length ? 1 : 0),
        active: true,
      }));
      const images = product.images.map((url, position) => ({ product_id: product.id, url, alt_text: product.name, position }));
      const [variantResult, imageResult] = await Promise.all([
        supabase.from("product_variants").insert(variants),
        images.length ? supabase.from("product_images").insert(images) : Promise.resolve({ error: null }),
      ]);
      if (variantResult.error || imageResult.error) return notSaved;
    }
  } catch {
    return notSaved;
  }

  await audit(viewer, "product.import", "product", "starter", { count: starterProducts.length });
  refreshStore();
  revalidatePath("/admin/products");
  return { status: "success", message: "The launch collection was imported." };
}

/** Decodes the photo and writes a fresh WebP, dropping camera metadata and anything hidden in the file. */
async function sanitizePhoto(bytes: Uint8Array) {
  try {
    return await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    return null;
  }
}

async function ensurePhotoBucket(supabase: Admin) {
  const { data } = await supabase.storage.getBucket(PRODUCT_IMAGE_BUCKET);
  if (data) return true;
  const { error } = await supabase.storage.createBucket(PRODUCT_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: AVATAR_UPLOAD_MAX_BYTES,
    allowedMimeTypes: ["image/webp"],
  });
  return !error || /exist/i.test(error.message);
}

export async function uploadProductImageAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "product-photo", 40);
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const parsed = idSchema.safeParse({ id: formText(formData.get("productId")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  const productId = parsed.data.id;

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a photo to upload." };
  if (file.size > AVATAR_UPLOAD_MAX_BYTES) return { status: "error", message: "That photo is too large. Try a smaller one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!detectImageType(bytes)) return { status: "error", message: "Use a PNG, JPEG, or WebP image." };
  const photo = await sanitizePhoto(bytes);
  if (!photo) return { status: "error", message: "That image could not be processed. Try a different file." };

  const altText = formText(formData.get("altText")).trim().slice(0, 160);
  try {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("name, product_images(id, position)")
      .eq("id", productId)
      .maybeSingle();
    if (productError) return notSaved;
    if (!product) return { status: "error", message: "That product no longer exists." };
    const existing = (product.product_images ?? []) as { position: number }[];
    if (existing.length >= MAX_PRODUCT_IMAGES) return { status: "error", message: "A product can have up to 8 photos." };
    if (!(await ensurePhotoBucket(supabase))) return notSaved;

    const path = `${productId}/${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
    const upload = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, photo, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (upload.error) return notSaved;

    const { data: publicUrl } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    const position = existing.reduce((highest, image) => Math.max(highest, image.position + 1), 0);
    const inserted = await supabase.from("product_images").insert({
      product_id: productId,
      url: publicUrl.publicUrl,
      alt_text: altText.length >= 2 ? altText : String(product.name),
      position,
    });
    if (inserted.error) {
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
      return notSaved;
    }
  } catch {
    return notSaved;
  }

  await audit(viewer, "product.photo.add", "product", productId);
  refreshStore();
  revalidatePath(`/admin/products/${productId}`);
  return { status: "success", message: "Photo added." };
}

/** Looks up a photo's product so every photo change also refreshes that product's page. */
async function photoProduct(supabase: Admin, imageId: string) {
  const { data, error } = await supabase.from("product_images").select("id, product_id, url, position").eq("id", imageId).maybeSingle();
  if (error || !data) return null;
  return { productId: String(data.product_id), url: String(data.url), position: Number(data.position) };
}

export async function deleteProductImageAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "product-photo", 40);
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const parsed = idSchema.safeParse({ id: formText(formData.get("id")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  let productId: string;
  try {
    const photo = await photoProduct(supabase, parsed.data.id);
    if (!photo) return { status: "error", message: "That photo no longer exists." };
    productId = photo.productId;
    const { error } = await supabase.from("product_images").delete().eq("id", parsed.data.id);
    if (error) return notSaved;

    // Only files inside this product's own folder in our bucket are removed.
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
    const path = photo.url.includes(marker) ? decodeURIComponent(photo.url.split(marker)[1] ?? "") : "";
    if (path.startsWith(`${productId}/`) && !path.includes("..")) {
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
    }
  } catch {
    return notSaved;
  }

  await audit(viewer, "product.photo.delete", "product", productId);
  refreshStore();
  revalidatePath(`/admin/products/${productId}`);
  return { status: "success", message: "Photo removed." };
}

export async function moveProductImageAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "product-photo", 80);
  if ("error" in checked) return checked.error;
  const { supabase } = checked;

  const parsed = imageMoveSchema.safeParse({ id: formText(formData.get("id")), direction: formText(formData.get("direction")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  let productId: string;
  try {
    const photo = await photoProduct(supabase, parsed.data.id);
    if (!photo) return { status: "error", message: "That photo no longer exists." };
    productId = photo.productId;
    const { data: siblings, error } = await supabase
      .from("product_images")
      .select("id, position")
      .eq("product_id", productId)
      .order("position")
      .order("id");
    if (error || !siblings) return notSaved;

    // Renumber 0..n-1 in the new order, which also repairs any gaps or ties.
    const order = siblings.map((row) => String(row.id));
    const from = order.indexOf(parsed.data.id);
    const to = parsed.data.direction === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= order.length) return { status: "success", message: "Photo order saved." };
    [order[from], order[to]] = [order[to], order[from]];
    for (const [position, imageId] of order.entries()) {
      const result = await supabase.from("product_images").update({ position }).eq("id", imageId);
      if (result.error) return notSaved;
    }
  } catch {
    return notSaved;
  }

  refreshStore();
  revalidatePath(`/admin/products/${productId}`);
  return { status: "success", message: "Photo order saved." };
}

export async function updateProductImageAltAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "product-photo", 80);
  if ("error" in checked) return checked.error;
  const { supabase } = checked;

  const parsed = imageAltSchema.safeParse({ id: formText(formData.get("id")), altText: formText(formData.get("altText")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  let productId: string;
  try {
    const photo = await photoProduct(supabase, parsed.data.id);
    if (!photo) return { status: "error", message: "That photo no longer exists." };
    productId = photo.productId;
    const { error } = await supabase.from("product_images").update({ alt_text: parsed.data.altText }).eq("id", parsed.data.id);
    if (error) return notSaved;
  } catch {
    return notSaved;
  }

  refreshStore();
  revalidatePath(`/admin/products/${productId}`);
  return { status: "success", message: "Photo description saved." };
}

function formFlag(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function saveCollectionAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "collection-save");
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const idValue = formText(formData.get("id"));
  const id = idValue ? idSchema.safeParse({ id: idValue }) : null;
  if (id && !id.success) return { status: "error", message: firstIssue(id) };

  const parsed = collectionSchema.safeParse({
    name: formText(formData.get("name")),
    slug: formText(formData.get("slug")),
    description: formText(formData.get("description")),
    active: formFlag(formData, "active"),
    productIds: formData.getAll("productIds").filter((value): value is string => typeof value === "string"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  const input = parsed.data;

  let collectionId = id?.data.id ?? "";
  try {
    const row = { name: input.name, slug: input.slug, description: input.description, active: input.active };
    const result = collectionId
      ? await supabase.from("collections").update(row).eq("id", collectionId).select("id").maybeSingle()
      : await supabase.from("collections").insert(row).select("id").single();
    if (isDuplicate(result.error)) return { status: "error", message: "Another collection already uses that web address." };
    if (result.error) return notSaved;
    if (!result.data) return { status: "error", message: "That collection no longer exists." };
    collectionId = String(result.data.id);

    const cleared = await supabase.from("collection_products").delete().eq("collection_id", collectionId);
    if (cleared.error) return notSaved;
    if (input.productIds.length) {
      const links = input.productIds.map((productId, position) => ({ collection_id: collectionId, product_id: productId, position }));
      const linked = await supabase.from("collection_products").insert(links);
      if (linked.error) return { status: "error", message: "One of the chosen products no longer exists. Reload and try again." };
    }
  } catch {
    return notSaved;
  }

  await audit(viewer, id ? "collection.update" : "collection.create", "collection", collectionId, { slug: input.slug });
  refreshStore();
  revalidatePath("/admin/collections");
  if (!id) redirect(`/admin/collections/${collectionId}?created=1`);
  return { status: "success", message: "Collection saved." };
}

export async function deleteCollectionAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "collection-delete", 20);
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const parsed = idSchema.safeParse({ id: formText(formData.get("id")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  try {
    const { error } = await supabase.from("collections").delete().eq("id", parsed.data.id);
    if (error) return notSaved;
  } catch {
    return notSaved;
  }

  await audit(viewer, "collection.delete", "collection", parsed.data.id);
  refreshStore();
  revalidatePath("/admin/collections");
  redirect("/admin/collections?deleted=1");
}

export async function saveDiscountAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "discount-save");
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const idValue = formText(formData.get("id"));
  const id = idValue ? idSchema.safeParse({ id: idValue }) : null;
  if (id && !id.success) return { status: "error", message: firstIssue(id) };

  const parsed = discountSchema.safeParse({
    code: formText(formData.get("code")),
    kind: formText(formData.get("kind")),
    value: formText(formData.get("value")),
    startsAt: formText(formData.get("startsAt")),
    endsAt: formText(formData.get("endsAt")),
    usageLimit: formText(formData.get("usageLimit")),
    active: formFlag(formData, "active"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  const input = parsed.data;

  let discountId = id?.data.id ?? "";
  try {
    const row = {
      code: input.code,
      kind: input.kind,
      value: input.value,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      usage_limit: input.usageLimit,
      active: input.active,
    };
    const result = discountId
      ? await supabase.from("discounts").update(row).eq("id", discountId).select("id").maybeSingle()
      : await supabase.from("discounts").insert(row).select("id").single();
    if (isDuplicate(result.error)) return { status: "error", message: "That discount code already exists." };
    if (result.error) return notSaved;
    if (!result.data) return { status: "error", message: "That discount code no longer exists." };
    discountId = String(result.data.id);
  } catch {
    return notSaved;
  }

  await audit(viewer, id ? "discount.update" : "discount.create", "discount", discountId, { code: input.code, active: input.active });
  revalidatePath("/admin/discounts");
  if (!id) redirect("/admin/discounts?created=1");
  return { status: "success", message: "Discount code saved." };
}

export async function deleteDiscountAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "discount-delete", 20);
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const parsed = idSchema.safeParse({ id: formText(formData.get("id")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  try {
    const { error } = await supabase.from("discounts").delete().eq("id", parsed.data.id);
    if (error) return notSaved;
  } catch {
    return notSaved;
  }

  await audit(viewer, "discount.delete", "discount", parsed.data.id);
  revalidatePath("/admin/discounts");
  redirect("/admin/discounts?deleted=1");
}

export async function updateOrderAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const checked = await guard("manage_orders", "order-update");
  if ("error" in checked) return checked.error;
  const { viewer, supabase } = checked;

  const parsed = orderUpdateSchema.safeParse({
    publicId: formText(formData.get("publicId")),
    status: formText(formData.get("status")),
    trackingNumber: formText(formData.get("trackingNumber")),
    adminNote: formText(formData.get("adminNote")),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  const input = parsed.data;

  let previous: string;
  try {
    const { data: current, error: readError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("public_id", input.publicId)
      .maybeSingle();
    if (readError) return notSaved;
    if (!current) return { status: "error", message: "That order no longer exists." };
    previous = String(current.status);

    const { error } = await supabase
      .from("orders")
      .update({
        status: input.status,
        tracking_number: input.trackingNumber,
        admin_note: input.adminNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);
    if (error) return notSaved;
  } catch {
    return notSaved;
  }

  await audit(viewer, "order.update", "order", input.publicId, { from: previous, to: input.status });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${encodeURIComponent(input.publicId)}`);
  revalidatePath("/account/orders");
  return { status: "success", message: "Order updated." };
}
