import "server-only";

import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { googlePhotoUrl, isOwnAvatarPath, publicAvatarUrl } from "@/lib/avatar";
import { authDemoMode, authEnabled } from "@/lib/features";
import { parseRole, type MemberRole } from "@/lib/roles";
import { createAuthClient } from "@/lib/supabase-auth";

/** The signed-in member, as the site's pages and header need them. */
export type Member = {
  id: string;
  email: string;
  name: string;
  initials: string;
  /** E.164, e.g. +94771234567; null until the member adds one. */
  phone: string | null;
  phoneCountry: string | null;
  /** False for accounts created only with Google until they set a password. */
  hasPassword: boolean;
  /** Sign-in methods on the account, e.g. ["email"], ["google"]. */
  providers: string[];
  createdAt: string | null;
  /** Web Dev, Owner, Staff, or Supporter; null for regular members. From app_metadata, which members cannot edit. */
  role: MemberRole | null;
  /** The photo to show: an uploaded one first, then the Google account photo; null shows initials. */
  avatarUrl: string | null;
  avatarSource: AvatarSource | null;
};

/** "upload" is a photo stored by this site; "email" came with the Google account. */
export type AvatarSource = "upload" | "email";

/** The subset the client header needs; safe to pass to client components. */
export type MemberSummary = Pick<Member, "name" | "email" | "initials" | "role" | "avatarUrl">;

function initialsOf(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length >= 2 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? email).slice(0, 2);
  return letters.toUpperCase();
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Picks the photo from fields members cannot edit: the uploaded photo's path
 * lives in app_metadata, and the Google photo comes from the Google identity.
 */
function avatarOf(user: User): Pick<Member, "avatarUrl" | "avatarSource"> {
  const path = user.app_metadata?.avatar_path;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl && isOwnAvatarPath(user.id, path)) {
    return { avatarUrl: publicAvatarUrl(supabaseUrl, path), avatarSource: "upload" };
  }

  const google = user.identities?.find((identity) => identity.provider === "google")?.identity_data;
  const photo = googlePhotoUrl(google?.avatar_url) ?? googlePhotoUrl(google?.picture);
  return photo ? { avatarUrl: photo, avatarSource: "email" } : { avatarUrl: null, avatarSource: null };
}

export function memberFromUser(user: User): Member {
  const metadata = user.user_metadata ?? {};
  const email = user.email ?? "";
  // Google fills full_name/name; email sign-ups use display_name.
  const name = text(metadata.display_name) ?? text(metadata.full_name) ?? text(metadata.name) ?? email.split("@")[0];
  const providers = [...new Set((user.identities ?? []).map((identity) => identity.provider))];

  return {
    id: user.id,
    email,
    name,
    initials: initialsOf(name, email),
    phone: text(metadata.phone),
    phoneCountry: text(metadata.phone_country),
    hasPassword: providers.includes("email") || metadata.password_set === true,
    providers,
    createdAt: user.created_at ?? null,
    role: parseRole(user.app_metadata?.role),
    ...avatarOf(user),
  };
}

const DEMO_MEMBER: Member = {
  id: "00000000-0000-4000-8000-000000000000",
  email: "preview@brakmasra.local",
  name: "Preview Member",
  initials: "PM",
  phone: "+94771234567",
  phoneCountry: "LK",
  hasPassword: true,
  providers: ["email"],
  createdAt: null,
  // Local preview only: shows every staff tool.
  role: "web_dev",
  avatarUrl: null,
  avatarSource: null,
};

async function hasAuthCookie() {
  return (await cookies()).getAll().some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

/**
 * The verified signed-in member, or null. Anonymous visitors (no Supabase
 * auth cookie) never trigger a call to Supabase.
 */
export async function getCurrentMember(): Promise<Member | null> {
  if (!authEnabled) return null;
  if (authDemoMode) return DEMO_MEMBER;
  if (!(await hasAuthCookie())) return null;

  try {
    const supabase = await createAuthClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims?.claims) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return memberFromUser(data.user);
  } catch {
    return null;
  }
}

export function memberSummary(member: Member | null): MemberSummary | null {
  return member
    ? { name: member.name, email: member.email, initials: member.initials, role: member.role, avatarUrl: member.avatarUrl }
    : null;
}
