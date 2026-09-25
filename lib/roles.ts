// Client-safe role rules. A member's role lives in Supabase `app_metadata.role`,
// which only the server (service role) or the Supabase dashboard can write, so
// members can never promote themselves.

/** Roles with staff tools, highest first. Web Dev has full access to the website. */
export const STAFF_ROLES = ["web_dev", "owner", "staff"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** Every role, highest first. Supporter is a badge only: the same access as a regular member. */
export const MEMBER_ROLES = [...STAFF_ROLES, "supporter"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const ROLE_RANK: Record<MemberRole, number> = { web_dev: 4, owner: 3, staff: 2, supporter: 1 };

// Older role names keep working.
const LEGACY_ROLES: Record<string, MemberRole> = { admin: "staff", support: "supporter" };

export function parseRole(value: unknown): MemberRole | null {
  if (typeof value !== "string") return null;
  if ((MEMBER_ROLES as readonly string[]).includes(value)) return value as MemberRole;
  return LEGACY_ROLES[value] ?? null;
}

export function hasRoleAtLeast(role: MemberRole | null, minimum: MemberRole) {
  return role !== null && ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Web Dev, Owner, or Staff. Supporters and regular members are not staff. */
export function isStaff(role: MemberRole | null): role is StaffRole {
  return hasRoleAtLeast(role, "staff");
}

export const PERMISSIONS = [
  "control_room",   // open the Control Room
  "view_messages",  // read contact form messages
  "view_orders",    // read all orders
  "view_newsletter",// read drop-alert subscribers
  "manage_team",    // change other people's roles
  "manage_site",    // site-wide settings and developer tools
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<MemberRole, readonly Permission[]> = {
  web_dev: PERMISSIONS,
  owner: ["control_room", "view_messages", "view_orders", "view_newsletter", "manage_team"],
  staff: ["control_room", "view_messages", "view_orders"],
  supporter: [],
};

export function can(role: MemberRole | null, permission: Permission) {
  return role !== null && ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Which roles `actor` may give to or take from someone who currently holds
 * `current` (null = regular member). Web Dev manages owners, staff, and
 * supporters; owners manage staff and supporters. Nobody changes a Web Dev or
 * their own role here; the Web Dev role is granted only from the Supabase dashboard.
 */
export function assignableRoles(actor: MemberRole | null, current: MemberRole | null): (MemberRole | null)[] {
  if (actor === "web_dev" && current !== "web_dev") return ["owner", "staff", "supporter", null];
  if (actor === "owner" && (current === null || current === "staff" || current === "supporter")) {
    return ["staff", "supporter", null];
  }
  return [];
}
