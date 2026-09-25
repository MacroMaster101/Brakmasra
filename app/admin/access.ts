import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { controlRoomConfigured } from "@/lib/control-room";
import type { SectionData } from "@/lib/control-room-validation";
import { authDemoMode, authEnabled } from "@/lib/features";
import { getCurrentMember, type Member } from "@/lib/member";
import { can, type Permission, type StaffRole } from "@/lib/roles";

export type ControlRoomViewer = Member & { role: StaffRole };

// The layout and each page both need the viewer; one Supabase round trip per request.
const currentMember = cache(getCurrentMember);

/**
 * The verified viewer if they may open this Control Room page. The role always
 * comes from the server session. Anyone without access gets a plain 404 so the
 * area's existence isn't confirmed.
 */
export async function requireControlRoom(permission: Permission, path: string): Promise<ControlRoomViewer> {
  if (!authEnabled) notFound();
  const member = await currentMember();
  // `path` is a fixed route from our own pages, never user input.
  if (!member) redirect(`/login?next=${path}`);
  if (!can(member.role, "control_room") || !can(member.role, permission)) notFound();
  return member as ControlRoomViewer;
}

/**
 * Loads a section's data. Local preview never queries Supabase, and a missing
 * service-role key shows a setup hint instead of an error.
 */
export async function loadSection<T>(load: () => Promise<T | null>): Promise<SectionData<T>> {
  if (authDemoMode) return { kind: "preview" };
  if (!controlRoomConfigured()) return { kind: "not-configured" };
  const data = await load();
  return data === null ? { kind: "error" } : { kind: "ready", data };
}

export const noIndex = { index: false, follow: false } as const;
