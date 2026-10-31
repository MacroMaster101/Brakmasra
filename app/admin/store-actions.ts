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
  collectionSectionSchemas,
  productSectionSchemas,
  type ProductSection,
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
import { automaticProductSlug, productAddressPolicy, suffixedProductSlug } from "@/lib/product-address";
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
    alternate_price_minor: input.alternatePrice,
    currency: input.currency,
    discount_kind: input.discountKind,
    discount_value: input.discountValue,
    fabric: input.fabric,
    care: input.care,
    status: input.status,
    category: input.category,
    badge: input.badge,
    coming_soon: input.comingSoon,
    featured: input.featured,
    position: input.position,
    si_description: input.siDescription,
    si_fabric: input.siFabric,
    si_care: input.siCare,
    updated_at: new Date().toISOString(),
  };
}

/** Resolve role restrictions on the server; a hidden or forged field cannot change an owner's product link. */
async function productAddress(viewer: Member, supabase: Admin, form: FormData, id: string | null) {
  const policy = productAddressPolicy(viewer.role, formText(form.get("slugMode")), form.get("regenerateSlug") === "on", Boolean(id));
  if (policy.custom) { const slug = formText(form.get("slug")); const fallback = formText(form.get("slugMode")) !== "custom" && !slug; return { slug: fallback ? automaticProductSlug(formText(form.get("name"))) : slug, generated: fallback, preserve: false }; }
  if (policy.preserve) {
    try {
      const { data, error } = await supabase.from("products").select("slug").eq("id", id!).maybeSingle();
      if (error || !data) return null;
      return { slug: String(data.slug), generated: false, preserve: true };
    } catch { return null; }
  }
  return { slug: automaticProductSlug(formText(form.get("name"))), generated: true, preserve: false };
}

/** A name collision gets an automatic suffix; the unique database constraint settles concurrent creates. */
async function saveAtProductAddress<T extends { error: { code?: string } | null }>(address: { slug: string; generated: boolean }, save: (slug: string) => PromiseLike<T>) {
  let slug = address.slug;
  let result = await save(slug);
  for (let attempt = 0; address.generated && isDuplicate(result.error) && attempt < 3; attempt++) {
    slug = suffixedProductSlug(address.slug, randomBytes(3).toString("hex"));
    result = await save(slug);
  }
  return { result, slug };
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

  const address = await productAddress(viewer, supabase, formData, id?.data.id ?? null);
  if (!address) return notSaved;
  const parsed = productSchema.safeParse({ ...productFormValues(formData), slug: address.slug });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  const input = parsed.data;

  let productId = id?.data.id ?? "";
  try {
    const saved = await saveAtProductAddress(address, slug => supabase.rpc("admin_save_product", { p_id: productId || null, p_product: productRow({ ...input, slug }), p_variants: input.variants }));
    const result = saved.result;
    input.slug = saved.slug;
    if (isDuplicate(result.error)) return { status: "error", message: "Another product already uses that web address." };
    if (result.error?.code === "P0002") return { status: "error", message: "That product no longer exists." };
    if (result.error || !result.data) return notSaved;
    productId = String(result.data);
  } catch {
    return notSaved;
  }

  await audit(viewer, id ? "product.update" : "product.create", "product", productId, { slug: input.slug, status: input.status });
  refreshStore();
  revalidatePath("/admin/products");
  // With photos waiting, the browser uploads them before opening the product.
  if (!id && formData.get("deferRedirect") === "1") return { status: "success", message: "Product saved.", productId };
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  return { status: "success", message: "Product saved." };
}

/** Each section is validated independently; the database merges it under a row lock. */
export async function saveProductSectionAction(_state: ControlRoomActionState, form: FormData): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "product-save");
  if ("error" in checked) return checked.error;
  const id = idSchema.safeParse({ id: formText(form.get("id")) });
  const section = formText(form.get("section"));
  if (!id.success || !Object.hasOwn(productSectionSchemas, section)) return { status: "error", message: "Check the section and try again." };
  const address = section === "basics" ? await productAddress(checked.viewer, checked.supabase, form, id.data.id) : null;
  if (section === "basics" && !address) return notSaved;
  const values = productFormValues(form);
  const parsed = productSectionSchemas[section as ProductSection].safeParse(address ? { ...values, slug: address.slug } : values);
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  const columns: Record<string, string> = { price: "price_minor", alternatePrice: "alternate_price_minor", discountKind: "discount_kind", discountValue: "discount_value", comingSoon: "coming_soon", siDescription: "si_description", siFabric: "si_fabric", siCare: "si_care" };
  const patch = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [columns[key] ?? key, value]));
  // Exclude an unchanged automatic address so concurrent developer changes are preserved by the row-locking RPC.
  if (address?.preserve) delete patch.slug;
  try {
    const result = address && !address.preserve
      ? (await saveAtProductAddress(address, slug => checked.supabase.rpc("admin_save_product_section", { p_id: id.data.id, p_section: section, p_patch: { ...patch, slug } }))).result
      : await checked.supabase.rpc("admin_save_product_section", { p_id: id.data.id, p_section: section, p_patch: patch });
    if (isDuplicate(result.error)) return { status: "error", message: "Another product already uses that web address." };
    if (result.error?.code === "P0002") return { status: "error", message: "That product no longer exists." };
    if (result.error || !result.data) return notSaved;
  } catch { return notSaved; }
  await audit(checked.viewer, "product.update", "product", id.data.id, { section });
  refreshStore();
  revalidatePath("/admin/products");
  return { status: "success", message: "Section saved. Other sections are unchanged." };
}

export async function saveCollectionSectionAction(_state: ControlRoomActionState, form: FormData): Promise<ControlRoomActionState> {
  const checked = await guard("manage_catalog", "collection-save");
  if ("error" in checked) return checked.error;
  const id = idSchema.safeParse({ id: formText(form.get("id")) });
  const section = formText(form.get("section"));
  if (!id.success || (section !== "basics" && section !== "products")) return { status: "error", message: "Check the section and try again." };
  const parsed = collectionSectionSchemas[section].safeParse({ name: formText(form.get("name")), slug: formText(form.get("slug")), description: formText(form.get("description")), active: form.get("active") === "on", productIds: form.getAll("productIds") });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  try {
    const result = await checked.supabase.rpc("admin_save_collection_section", { p_id: id.data.id, p_section: section, p_patch: parsed.data });
    if (isDuplicate(result.error)) return { status: "error", message: "Another collection already uses that web address." };
    if (result.error?.code === "23503") return { status: "error", message: "A selected product no longer exists. Reload and try again." };
    if (result.error || !result.data) return notSaved;
  } catch { return notSaved; }
  await audit(checked.viewer, "collection.update", "collection", id.data.id, { section });
  refreshStore(); revalidatePath("/admin/collections");
  return { status: "success", message: "Section saved. Other sections are unchanged." };
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
        featured: product.featured === true,
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
  const { viewer, supabase } = checked;

  const parsed = imageMoveSchema.safeParse({ id: formText(formData.get("id")), direction: formText(formData.get("direction")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  let productId: string;
  try {
    const result = await supabase.rpc("admin_move_product_image", { p_id: parsed.data.id, p_direction: parsed.data.direction });
    if (result.error?.code === "P0002") return { status: "error", message: "That photo no longer exists." };
    if (result.error || !result.data) return notSaved;
    productId = String(result.data);
  } catch {
    return notSaved;
  }

  await audit(viewer, "product.photo.move", "product", productId);
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
  const { viewer, supabase } = checked;

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

  await audit(viewer, "product.photo.description", "product", productId);
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
    const result = await supabase.rpc("admin_save_collection", {
      p_id: collectionId || null,
      p_collection: { name: input.name, slug: input.slug, description: input.description, active: input.active },
      p_product_ids: input.productIds,
    });
    if (isDuplicate(result.error)) return { status: "error", message: "Another collection already uses that web address." };
    if (result.error?.code === "P0002") return { status: "error", message: "That collection no longer exists." };
    if (result.error?.code === "23503") return { status: "error", message: "One of the chosen products no longer exists. Reload and try again." };
    if (result.error || !result.data) return notSaved;
    collectionId = String(result.data);
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
