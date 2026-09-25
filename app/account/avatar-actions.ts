"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

import type { AccountActionState } from "@/app/account/actions";
import {
  AVATAR_BUCKET,
  AVATAR_SIZE,
  AVATAR_UPLOAD_MAX_BYTES,
  avatarPathFor,
  detectImageType,
  isOwnAvatarPath,
} from "@/lib/avatar";
import { authDemoMode, authEnabled } from "@/lib/features";
import { getCurrentMember } from "@/lib/member";
import { rateLimit } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request";
import { getSupabaseServerClient } from "@/lib/supabase";

const closed: AccountActionState = { status: "error", message: "Member access is coming soon." };
const demoSaved: AccountActionState = { status: "success", message: "Preview mode. Changes are not saved." };
const signInAgain: AccountActionState = { status: "error", message: "Sign in again to continue." };
const tooManyAttempts: AccountActionState = { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
const unavailable: AccountActionState = { status: "error", message: "Profile photos are unavailable right now. Please try again." };

type Admin = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

async function photoRateLimit(userId: string) {
  const userKey = createHash("sha256").update(userId).digest("hex").slice(0, 24);
  return rateLimit(`account:avatar:${clientAddress(await headers())}:${userKey}`, 10, 10 * 60_000);
}

/**
 * Decodes the upload to pixels and writes a fresh square WebP. Only pixels
 * survive, so camera metadata (such as GPS) and anything hidden after the
 * image data are dropped. `rotate()` applies the camera's orientation first.
 */
async function sanitize(bytes: Uint8Array): Promise<Buffer | null> {
  try {
    return await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return null;
  }
}

/** Creates the public photo bucket the first time it is needed. */
async function ensureBucket(admin: Admin) {
  const { data } = await admin.storage.getBucket(AVATAR_BUCKET);
  if (data) return true;
  const { error } = await admin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: AVATAR_UPLOAD_MAX_BYTES,
    allowedMimeTypes: ["image/webp"],
  });
  // Another request may have created it in the meantime.
  return !error || /exist/i.test(error.message);
}

/** Deletes the member's stored photos, except `keep`. */
async function removeStoredPhotos(admin: Admin, userId: string, keep?: string) {
  const { data } = await admin.storage.from(AVATAR_BUCKET).list(userId, { limit: 100 });
  const paths = (data ?? [])
    .map((item) => `${userId}/${item.name}`)
    .filter((path) => path !== keep && isOwnAvatarPath(userId, path));
  if (paths.length) await admin.storage.from(AVATAR_BUCKET).remove(paths);
}

export async function uploadAvatarAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  if (!authEnabled) return closed;
  // Ids always come from the verified session, never from the form.
  const member = await getCurrentMember();
  if (!member) return signInAgain;
  if (authDemoMode) return demoSaved;

  const attempt = await photoRateLimit(member.id);
  if (!attempt.allowed) return tooManyAttempts;

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a photo to upload." };
  if (file.size > AVATAR_UPLOAD_MAX_BYTES) return { status: "error", message: "That photo is too large. Try a smaller one." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!detectImageType(bytes)) return { status: "error", message: "Use a PNG, JPEG, or WebP image." };

  const photo = await sanitize(bytes);
  if (!photo) return { status: "error", message: "That image could not be processed. Try a different file." };

  const admin = getSupabaseServerClient();
  if (!admin) return unavailable;

  try {
    if (!(await ensureBucket(admin))) return unavailable;

    const path = avatarPathFor(member.id);
    const { error: uploadError } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(path, photo, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (uploadError) return unavailable;

    // app_metadata only changes on the server, so members can't point it elsewhere.
    const { error } = await admin.auth.admin.updateUserById(member.id, { app_metadata: { avatar_path: path } });
    if (error) {
      await admin.storage.from(AVATAR_BUCKET).remove([path]);
      return unavailable;
    }

    await removeStoredPhotos(admin, member.id, path);
  } catch {
    return unavailable;
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Profile photo updated." };
}

export async function removeAvatarAction(): Promise<AccountActionState> {
  if (!authEnabled) return closed;
  const member = await getCurrentMember();
  if (!member) return signInAgain;
  if (authDemoMode) return demoSaved;
  if (member.avatarSource !== "upload") return { status: "error", message: "There is no uploaded photo to remove." };

  const attempt = await photoRateLimit(member.id);
  if (!attempt.allowed) return tooManyAttempts;

  const admin = getSupabaseServerClient();
  if (!admin) return unavailable;

  try {
    const { error } = await admin.auth.admin.updateUserById(member.id, { app_metadata: { avatar_path: null } });
    if (error) return unavailable;
    await removeStoredPhotos(admin, member.id);
  } catch {
    return unavailable;
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Profile photo removed." };
}
