import type { ControlRoomActionState } from "@/app/admin/actions";
import { saveProductAction, uploadProductImageAction } from "@/app/admin/store-actions";
import { AVATAR_PICK_MAX_BYTES, AVATAR_TYPES, AVATAR_UPLOAD_MAX_BYTES } from "@/lib/avatar";
import type { TextKey } from "@/lib/i18n";

const PHOTO_SIZE = 1600;
const IDLE: ControlRoomActionState = { status: "idle", message: "" };

/** The shop shows the first photo on a product card and fades to the second on hover. */
export function photoRole(index: number): TextKey | null {
  return index === 0 ? "crsBeforeHoverPhoto" : index === 1 ? "crsHoverPhoto" : null;
}

export function moveInList<T>(list: T[], index: number, direction: "up" | "down"): T[] {
  const target = index + (direction === "up" ? -1 : 1);
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function photoError(file: File): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return "Use a PNG, JPEG, or WebP image.";
  if (file.size > AVATAR_PICK_MAX_BYTES) return "That photo is too large. Try a smaller one.";
  return null;
}

/** Shrinks a photo in the browser so large phone pictures upload fast; the server re-encodes it again. */
async function shrinkPhoto(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, PHOTO_SIZE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const encode = (type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    for (const quality of [0.86, 0.72, 0.6]) {
      const webp = await encode("image/webp", quality);
      const blob = webp?.type === "image/webp" ? webp : await encode("image/jpeg", quality);
      if (blob && blob.size <= AVATAR_UPLOAD_MAX_BYTES) return blob;
    }
    return null;
  } catch {
    return null;
  }
}

/** A smaller copy ready to upload, or the reason this file cannot be used. */
export async function preparePhoto(file: File): Promise<File | string> {
  const problem = photoError(file);
  if (problem) return problem;
  const blob = await shrinkPhoto(file);
  if (!blob) return "That image could not be processed. Try a different file.";
  return new File([blob], blob.type === "image/webp" ? "photo.webp" : "photo.jpg", { type: blob.type });
}

export function uploadPhoto(productId: string, photo: File) {
  const formData = new FormData();
  formData.append("productId", productId);
  formData.append("photo", photo);
  return uploadProductImageAction(IDLE, formData);
}

/**
 * Photos need a product to belong to, so the product is saved first. Uploads run
 * one at a time to keep the chosen order, and a failed one never loses the product.
 */
export async function saveProductWithPhotos(
  state: ControlRoomActionState,
  form: FormData,
  photos: File[],
  open: (href: string) => void,
): Promise<ControlRoomActionState> {
  if (photos.length === 0) return saveProductAction(state, form);
  form.set("deferRedirect", "1");
  const reply = await saveProductAction(state, form);
  if (reply.status !== "success" || !reply.productId) return reply;
  let failed = 0;
  for (const photo of photos) {
    const result = await uploadPhoto(reply.productId, photo).catch(() => null);
    if (result?.status !== "success") failed += 1;
  }
  open(`/admin/products/${reply.productId}?created=1`);
  if (!failed) return reply;
  return { status: "success", message: `Product created, but ${failed} photo${failed === 1 ? "" : "s"} did not upload. Add ${failed === 1 ? "it" : "them"} below.` };
}
