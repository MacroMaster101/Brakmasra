import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { authEnabled } from "@/lib/features";
import { getCurrentMember, type Member } from "@/lib/member";
import { rateLimit } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request";
import { can, type Permission } from "@/lib/roles";
import { getSupabaseServerClient } from "@/lib/supabase";

// Shared checks for Control Room server actions. Kept out of the "use server"
// files so none of these helpers can be called from the browser.

/** The verified viewer, only if their server-side role grants `permission`. */
export async function viewerWith(permission: Permission): Promise<Member | null> {
  if (!authEnabled) return null;
  const member = await getCurrentMember();
  if (!member || !can(member.role, "control_room") || !can(member.role, permission)) return null;
  return member;
}

export async function controlRoomLimit(scope: string, limit: number, windowMs: number, viewerId: string) {
  const viewerKey = createHash("sha256").update(viewerId).digest("hex").slice(0, 24);
  return rateLimit(`control:${scope}:${clientAddress(await headers())}:${viewerKey}`, limit, windowMs);
}

/** Records who changed what. A failed insert is logged but never blocks the change. */
export async function audit(
  viewer: Pick<Member, "id" | "email">,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  try {
    // actor_id points at a legacy table, not auth users, so the actor goes in metadata.
    const { error } = await supabase.from("admin_audit_logs").insert({
      actor_id: null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: { actor_id: viewer.id, actor_email: viewer.email, ...metadata },
    });
    if (error) console.error(`Control Room audit log insert failed for ${action}`);
  } catch {
    console.error(`Control Room audit log insert failed for ${action}`);
  }
}
