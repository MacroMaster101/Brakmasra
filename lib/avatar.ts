// Profile photo rules shared by the member model, the upload action, the CSP,
// and the tests. Client-safe: no server imports.

export const AVATAR_BUCKET = "avatars";
/** Stored photos are square WebP files at this size. */
export const AVATAR_SIZE = 512;
/** The largest original the browser will try to shrink before upload. */
export const AVATAR_PICK_MAX_BYTES = 10 * 1024 * 1024;
/** What the server accepts after the browser has shrunk the photo. Server actions cap bodies at 1 MB. */
export const AVATAR_UPLOAD_MAX_BYTES = 900 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AvatarType = (typeof AVATAR_TYPES)[number];

/** Where Google serves account photos from. */
export const GOOGLE_PHOTO_HOST_SUFFIX = ".googleusercontent.com";

/** Reads the real format from the file's first bytes; the browser-supplied type is not trusted. */
export function detectImageType(bytes: Uint8Array): AvatarType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((byte, index) => bytes[index] === byte)) return "image/png";
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** A new object path inside the member's own folder. */
export function avatarPathFor(userId: string, now = Date.now()) {
  return `${userId}/avatar-${now}.webp`;
}

/** Only paths this site writes, inside the member's own folder, are ever turned into a URL. */
export function isOwnAvatarPath(userId: string, path: unknown): path is string {
  return typeof path === "string" && path.startsWith(`${userId}/`) && /^[0-9a-f-]{36}\/avatar-\d{10,16}\.webp$/.test(path);
}

export function publicAvatarUrl(supabaseUrl: string, path: string) {
  return `${new URL(supabaseUrl).origin}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}

/** The photo Google supplied at sign-in, only if it is an https URL on Google's photo host. */
export function googlePhotoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(GOOGLE_PHOTO_HOST_SUFFIX) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Image origins the CSP must allow for profile photos. */
export function avatarImageSources(supabaseUrl: string | undefined) {
  const sources = [`https://*${GOOGLE_PHOTO_HOST_SUFFIX}`];
  if (supabaseUrl) {
    try {
      sources.unshift(new URL(supabaseUrl).origin);
    } catch {
      // A malformed URL adds nothing; photos fall back to initials.
    }
  }
  return sources;
}
