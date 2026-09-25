import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  MESSAGE_STATUSES,
  SUBSCRIBER_STATUSES,
  type MessageFilter,
  type MessageStatus,
  type SubscriberStatus,
} from "@/lib/control-room-validation";
import { memberFromUser } from "@/lib/member";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { parseRole, type MemberRole } from "@/lib/roles";
import { getSupabaseServerClient } from "@/lib/supabase";

// Control Room reads. Every table here has RLS with no policies, so only the
// service role can read it. Callers must check the viewer's permission first.
// Lists return null when the data could not be loaded, so the page can say so.

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
};

export type AdminOrder = {
  publicId: string;
  customerEmail: string;
  status: OrderStatus;
  currency: string;
  totalMinor: number;
  createdAt: string;
};

export type Subscriber = { id: string; email: string; status: SubscriberStatus; consentedAt: string };
export type SubscriberCounts = Record<SubscriberStatus, number>;

export type TeamMember = { id: string; name: string; email: string; role: MemberRole };
export type AccountSummary = { id: string; name: string; email: string; role: MemberRole | null };

export type AuditEntry = {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  targetEmail: string | null;
  from: string | null;
  to: string | null;
  createdAt: string;
};

const USER_PAGE_SIZE = 200;
/** listUsers has no email filter, so lookups page through at most this many accounts. */
export const MAX_SCANNED_USERS = 1000;

export function controlRoomConfigured() {
  return getSupabaseServerClient() !== null;
}

function oneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function listContactMessages(filter: MessageFilter): Promise<ContactMessage[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    let query = supabase
      .from("contact_messages")
      .select("id, name, email, topic, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (filter !== "all") query = query.eq("status", filter);

    const { data, error } = await query;
    if (error || !data) return null;
    return data.flatMap((row) => (oneOf(MESSAGE_STATUSES, row.status)
      ? [{
        id: text(row.id),
        name: text(row.name),
        email: text(row.email),
        topic: text(row.topic),
        message: text(row.message),
        status: row.status,
        createdAt: text(row.created_at),
      }]
      : []));
  } catch {
    return null;
  }
}

async function countRows(table: string, column?: string, values?: readonly string[]): Promise<number | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    if (column && values) query = query.in(column, [...values]);
    const { count, error } = await query;
    return error || count === null ? null : count;
  } catch {
    return null;
  }
}

export function countNewMessages() {
  return countRows("contact_messages", "status", ["new"]);
}

export async function orderCounts(): Promise<{ total: number | null; paid: number | null }> {
  const [total, paid] = await Promise.all([
    countRows("orders"),
    // A fulfilled order was paid first.
    countRows("orders", "status", ["paid", "fulfilled"]),
  ]);
  return { total, paid };
}

export async function listOrders(): Promise<AdminOrder[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("public_id, customer_email, status, currency, total_minor, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !data) return null;
    return data.flatMap((row) => (oneOf(ORDER_STATUSES, row.status)
      ? [{
        publicId: text(row.public_id),
        customerEmail: text(row.customer_email),
        status: row.status,
        currency: text(row.currency).trim().toUpperCase(),
        totalMinor: Number(row.total_minor) || 0,
        createdAt: text(row.created_at),
      }]
      : []));
  } catch {
    return null;
  }
}

export async function listSubscribers(): Promise<Subscriber[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, status, consented_at")
      .order("consented_at", { ascending: false })
      .limit(100);
    if (error || !data) return null;
    return data.flatMap((row) => (oneOf(SUBSCRIBER_STATUSES, row.status)
      ? [{ id: text(row.id), email: text(row.email), status: row.status, consentedAt: text(row.consented_at) }]
      : []));
  } catch {
    return null;
  }
}

export async function subscriberCounts(): Promise<SubscriberCounts | null> {
  const counts = await Promise.all(SUBSCRIBER_STATUSES.map((status) => countRows("newsletter_subscribers", "status", [status])));
  if (counts.some((count) => count === null)) return null;
  return Object.fromEntries(SUBSCRIBER_STATUSES.map((status, index) => [status, counts[index]])) as SubscriberCounts;
}

export function countActiveSubscribers() {
  return countRows("newsletter_subscribers", "status", ["active"]);
}

function accountSummary(user: User): AccountSummary {
  const member = memberFromUser(user);
  return { id: member.id, name: member.name, email: member.email, role: member.role };
}

/**
 * Walks auth users page by page, up to MAX_SCANNED_USERS. `visit` returns true
 * to stop early. Returns false if a page could not be loaded.
 */
async function scanUsers(visit: (user: User) => boolean | void): Promise<{ ok: boolean; truncated: boolean }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false, truncated: false };

  try {
    for (let page = 1; page <= MAX_SCANNED_USERS / USER_PAGE_SIZE; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: USER_PAGE_SIZE });
      if (error) return { ok: false, truncated: false };
      for (const user of data.users) {
        if (visit(user)) return { ok: true, truncated: false };
      }
      if (data.users.length < USER_PAGE_SIZE) return { ok: true, truncated: false };
    }
    return { ok: true, truncated: true };
  } catch {
    return { ok: false, truncated: false };
  }
}

/** Everyone with a role, highest role first. */
export async function listTeam(): Promise<{ members: TeamMember[]; truncated: boolean } | null> {
  const members: TeamMember[] = [];
  const result = await scanUsers((user) => {
    if (parseRole(user.app_metadata?.role) === null) return;
    const summary = accountSummary(user);
    if (summary.role) members.push({ ...summary, role: summary.role });
  });
  if (!result.ok) return null;

  const rank: Record<MemberRole, number> = { web_dev: 0, owner: 1, staff: 2, supporter: 3 };
  members.sort((a, b) => rank[a.role] - rank[b.role] || a.name.localeCompare(b.name));
  return { members, truncated: result.truncated };
}

/** The account with exactly this email, `null` if there is none, or "error". */
export async function findAccountByEmail(email: string): Promise<AccountSummary | null | "error"> {
  const address = email.trim().toLowerCase();
  const match: { account: AccountSummary | null } = { account: null };
  const result = await scanUsers((user) => {
    if ((user.email ?? "").toLowerCase() !== address) return false;
    match.account = accountSummary(user);
    return true;
  });
  if (!result.ok) return "error";
  return match.account;
}

/** One account by id with the service role, or null. */
export async function getAccountById(id: string): Promise<AccountSummary | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (error || !data.user) return null;
    return accountSummary(data.user);
  } catch {
    return null;
  }
}

export async function recentAuditLogs(): Promise<AuditEntry[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("id, action, entity_type, entity_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !data) return null;
    return data.map((row) => {
      const metadata = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
      const optional = (value: unknown) => (typeof value === "string" && value ? value : null);
      return {
        id: Number(row.id),
        action: text(row.action),
        entityType: text(row.entity_type),
        entityId: optional(row.entity_id),
        actorEmail: optional(metadata.actor_email),
        targetEmail: optional(metadata.target_email),
        from: optional(metadata.from),
        to: optional(metadata.to),
        createdAt: text(row.created_at),
      };
    });
  } catch {
    return null;
  }
}
