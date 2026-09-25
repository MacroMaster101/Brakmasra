import type { User } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  avatarImageSources,
  avatarPathFor,
  detectImageType,
  googlePhotoUrl,
  isOwnAvatarPath,
  publicAvatarUrl,
} from "@/lib/avatar";

vi.mock("server-only", () => ({}));

const userId = "0f8fad5b-d9cb-469f-a165-70867728950e";
const otherId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

function googleIdentity(identityData: Record<string, string>) {
  return [{ id: "g1", user_id: userId, identity_id: "g1", provider: "google", identity_data: identityData }] as User["identities"];
}

function user(overrides: Partial<User>): User {
  return {
    id: userId,
    email: "nimal@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-09-01T00:00:00Z",
    identities: [],
    ...overrides,
  } as User;
}

describe("profile photo rules", () => {
  it("recognises PNG, JPEG and WebP from their first bytes only", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(detectImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("GIF89a"))).toBeNull();
  });

  it("only trusts photo paths this site writes inside the member's own folder", () => {
    const path = avatarPathFor(userId, 1_790_000_000_000);
    expect(path).toBe(`${userId}/avatar-1790000000000.webp`);
    expect(isOwnAvatarPath(userId, path)).toBe(true);
    expect(isOwnAvatarPath(otherId, path)).toBe(false);
    expect(isOwnAvatarPath(userId, `${userId}/../${otherId}/avatar-1790000000000.webp`)).toBe(false);
    expect(isOwnAvatarPath(userId, "https://evil.example/a.webp")).toBe(false);
    expect(isOwnAvatarPath(userId, null)).toBe(false);
  });

  it("builds public URLs on the project's own storage host", () => {
    expect(publicAvatarUrl("https://abcd.supabase.co/", `${userId}/avatar-1.webp`)).toBe(
      `https://abcd.supabase.co/storage/v1/object/public/avatars/${userId}/avatar-1.webp`,
    );
  });

  it("accepts Google photos only over https from Google's photo host", () => {
    expect(googlePhotoUrl("https://lh3.googleusercontent.com/a/abc=s96-c")).toBe("https://lh3.googleusercontent.com/a/abc=s96-c");
    expect(googlePhotoUrl("http://lh3.googleusercontent.com/a/abc")).toBeNull();
    expect(googlePhotoUrl("https://googleusercontent.com.evil.example/a")).toBeNull();
    expect(googlePhotoUrl("javascript:alert(1)")).toBeNull();
    expect(googlePhotoUrl(42)).toBeNull();
  });

  it("lists only the storage host and Google as image sources", () => {
    expect(avatarImageSources("https://abcd.supabase.co")).toEqual(["https://abcd.supabase.co", "https://*.googleusercontent.com"]);
    expect(avatarImageSources(undefined)).toEqual(["https://*.googleusercontent.com"]);
  });
});

describe("member photo", () => {
  afterEach(() => vi.unstubAllEnvs());

  async function memberFor(overrides: Partial<User>) {
    vi.stubEnv("SUPABASE_URL", "https://abcd.supabase.co");
    const { memberFromUser } = await import("@/lib/member");
    return memberFromUser(user(overrides));
  }

  it("prefers the uploaded photo", async () => {
    const member = await memberFor({
      app_metadata: { avatar_path: `${userId}/avatar-1790000000000.webp` },
      identities: googleIdentity({ avatar_url: "https://lh3.googleusercontent.com/a/x" }),
    });
    expect(member.avatarSource).toBe("upload");
    expect(member.avatarUrl).toBe(`https://abcd.supabase.co/storage/v1/object/public/avatars/${userId}/avatar-1790000000000.webp`);
  });

  it("falls back to the Google account photo, then to initials", async () => {
    const google = await memberFor({
      identities: googleIdentity({ picture: "https://lh3.googleusercontent.com/a/x" }),
    });
    expect(google).toMatchObject({ avatarSource: "email", avatarUrl: "https://lh3.googleusercontent.com/a/x" });

    const plain = await memberFor({});
    expect(plain).toMatchObject({ avatarSource: null, avatarUrl: null });
  });

  it("ignores photo links members can set themselves", async () => {
    const member = await memberFor({
      user_metadata: { avatar_url: "https://lh3.googleusercontent.com/a/x" },
      app_metadata: { avatar_path: `${otherId}/avatar-1790000000000.webp` },
    });
    expect(member).toMatchObject({ avatarSource: null, avatarUrl: null });
  });
});
