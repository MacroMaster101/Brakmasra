import { z } from "zod";

import { assignableRoles, can, MEMBER_ROLES, type MemberRole, type Permission } from "@/lib/roles";

// Pure Control Room rules, shared by the pages, the server actions, and the
// tests. Client-safe: no server imports.

export const CONTROL_ROOM_SECTIONS = [
  { key: "overview", href: "/admin", permission: "control_room" },
  { key: "products", href: "/admin/products", permission: "view_catalog" },
  { key: "collections", href: "/admin/collections", permission: "view_catalog" },
  { key: "discounts", href: "/admin/discounts", permission: "view_catalog" },
  { key: "orders", href: "/admin/orders", permission: "view_orders" },
  { key: "messages", href: "/admin/messages", permission: "view_messages" },
  { key: "subscribers", href: "/admin/subscribers", permission: "view_newsletter" },
  { key: "team", href: "/admin/team", permission: "manage_team" },
  { key: "site", href: "/admin/site", permission: "manage_site" },
] as const satisfies readonly { key: string; href: string; permission: Permission }[];
export type ControlRoomSection = (typeof CONTROL_ROOM_SECTIONS)[number]["key"];

/** The sections a role may open; empty for anyone without Control Room access. */
export function controlRoomSections(role: MemberRole | null): ControlRoomSection[] {
  if (!can(role, "control_room")) return [];
  return CONTROL_ROOM_SECTIONS.filter((section) => can(role, section.permission)).map((section) => section.key);
}

/** What a section page can show: nothing in local preview, a setup hint, a load error, or the data. */
export type SectionData<T> =
  | { kind: "preview" }
  | { kind: "not-configured" }
  | { kind: "error" }
  | { kind: "ready"; data: T };

export const MESSAGE_STATUSES =["new", "read", "resolved", "spam"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export type MessageFilter = MessageStatus | "all";

export const SUBSCRIBER_STATUSES = ["pending", "active", "unsubscribed"] as const;
export type SubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];

/** `?status=` on the messages page; anything unexpected shows every message. */
export function parseMessageFilter(value: unknown): MessageFilter {
  const single = Array.isArray(value) ? value[0] : value;
  const parsed = z.enum(MESSAGE_STATUSES).safeParse(single);
  return parsed.success ? parsed.data : "all";
}

export const messageStatusSchema = z.object({
  id: z.string().uuid("Check the form and try again."),
  status: z.enum(MESSAGE_STATUSES, { message: "Check the form and try again." }),
});

export const findMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254, "Enter a valid email address."),
});

/** Role choices travel as text; "none" removes the role. */
export const ROLE_CHOICES = [...MEMBER_ROLES, "none"] as const;
export type RoleChoice = (typeof ROLE_CHOICES)[number];

export const changeRoleSchema = z.object({
  userId: z.string().uuid("Check the form and try again."),
  role: z.enum(ROLE_CHOICES, { message: "Check the form and try again." }),
});

export function roleFromChoice(choice: RoleChoice): MemberRole | null {
  return choice === "none" ? null : choice;
}

export function choiceFromRole(role: MemberRole | null): RoleChoice {
  return role ?? "none";
}

type Person = { id: string; role: MemberRole | null };

/**
 * Whether `viewer` may give `requested` to `target`. Nobody changes their own
 * role, and only the roles `assignableRoles` offers for the target's current
 * role are allowed, so Web Dev is never granted here.
 */
export function canChangeRole(viewer: Person, target: Person, requested: MemberRole | null) {
  if (!can(viewer.role, "manage_team")) return false;
  if (viewer.id === target.id) return false;
  return assignableRoles(viewer.role, target.role).includes(requested);
}

/** Role choices to offer in the form for this target; empty when the viewer can't change them. */
export function roleChoicesFor(viewer: Person, target: Person): RoleChoice[] {
  if (!can(viewer.role, "manage_team") || viewer.id === target.id) return [];
  return assignableRoles(viewer.role, target.role).map(choiceFromRole);
}
