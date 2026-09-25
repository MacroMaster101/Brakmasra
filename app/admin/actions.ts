"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { firstIssue, formText } from "@/lib/account-validation";
import { findAccountByEmail, getAccountById, type AccountSummary } from "@/lib/control-room";
import {
  canChangeRole,
  changeRoleSchema,
  findMemberSchema,
  messageStatusSchema,
  roleChoicesFor,
  roleFromChoice,
  type RoleChoice,
} from "@/lib/control-room-validation";
import { authDemoMode, authEnabled } from "@/lib/features";
import { getCurrentMember, type Member } from "@/lib/member";
import { rateLimit } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request";
import { can, type Permission } from "@/lib/roles";
import { getSupabaseServerClient } from "@/lib/supabase";

export type FoundAccount = AccountSummary & { choices: RoleChoice[] };

export type ControlRoomActionState = {
  status: "idle" | "error" | "success";
  message: string;
  /** The account the team form is working on, with the roles the viewer may give it. */
  account?: FoundAccount;
};

// One reply for every access failure, so a probe learns nothing about roles.
const notAvailable: ControlRoomActionState = { status: "error", message: "This action is not available." };
const demoSaved: ControlRoomActionState = { status: "success", message: "Preview mode. Changes are not saved." };
const tooManyAttempts: ControlRoomActionState = { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
const notConfigured: ControlRoomActionState = { status: "error", message: "Control Room data is not connected yet." };
const roleNotSaved: ControlRoomActionState = { status: "error", message: "The role could not be updated. Please try again." };

/** The verified viewer, only if their server-side role grants `permission`. */
async function viewerWith(permission: Permission): Promise<Member | null> {
  if (!authEnabled) return null;
  const member = await getCurrentMember();
  if (!member || !can(member.role, "control_room") || !can(member.role, permission)) return null;
  return member;
}

async function controlRoomLimit(scope: string, limit: number, windowMs: number, viewerId: string) {
  const viewerKey = createHash("sha256").update(viewerId).digest("hex").slice(0, 24);
  return rateLimit(`control:${scope}:${clientAddress(await headers())}:${viewerKey}`, limit, windowMs);
}

async function audit(action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  try {
    // actor_id points at a legacy table, not auth users, so the actor goes in metadata.
    const { error } = await supabase
      .from("admin_audit_logs")
      .insert({ actor_id: null, action, entity_type: entityType, entity_id: entityId, metadata });
    if (error) console.error(`Control Room audit log insert failed for ${action}`);
  } catch {
    console.error(`Control Room audit log insert failed for ${action}`);
  }
}

export async function updateMessageStatusAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const viewer = await viewerWith("view_messages");
  if (!viewer) return notAvailable;
  if (authDemoMode) return demoSaved;

  const parsed = messageStatusSchema.safeParse({ id: formText(formData.get("id")), status: formText(formData.get("status")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  const attempt = await controlRoomLimit("message-status", 60, 10 * 60_000, viewer.id);
  if (!attempt.allowed) return tooManyAttempts;

  const supabase = getSupabaseServerClient();
  if (!supabase) return notConfigured;

  const { id, status } = parsed.data;
  let previous: string;
  try {
    const { data: current, error: readError } = await supabase
      .from("contact_messages")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (readError) return { status: "error", message: "The message could not be updated. Please try again." };
    if (!current) return { status: "error", message: "That message no longer exists." };
    previous = String(current.status);
    if (previous === status) return { status: "success", message: "Message status updated." };

    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
    if (error) return { status: "error", message: "The message could not be updated. Please try again." };
  } catch {
    return { status: "error", message: "The message could not be updated. Please try again." };
  }

  await audit("message.status", "contact_message", id, {
    actor_id: viewer.id,
    actor_email: viewer.email,
    from: previous,
    to: status,
  });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { status: "success", message: "Message status updated." };
}

export async function findMemberAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  const viewer = await viewerWith("manage_team");
  if (!viewer) return notAvailable;
  if (authDemoMode) return demoSaved;

  const parsed = findMemberSchema.safeParse({ email: formText(formData.get("email")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };

  const attempt = await controlRoomLimit("find-member", 30, 10 * 60_000, viewer.id);
  if (!attempt.allowed) return tooManyAttempts;
  if (!getSupabaseServerClient()) return notConfigured;

  const account = await findAccountByEmail(parsed.data.email);
  if (account === "error") return { status: "error", message: "Account lookup is unavailable right now. Please try again." };
  if (!account) return { status: "error", message: "No account with that email." };

  return {
    status: "success",
    message: "Account found.",
    account: { ...account, choices: roleChoicesFor(viewer, account) },
  };
}

export async function changeRoleAction(
  _previousState: ControlRoomActionState,
  formData: FormData,
): Promise<ControlRoomActionState> {
  // Everything is re-checked here; nothing about the viewer or target comes from the form but the ids.
  const viewer = await viewerWith("manage_team");
  if (!viewer) return notAvailable;
  if (authDemoMode) return demoSaved;

  const parsed = changeRoleSchema.safeParse({ userId: formText(formData.get("userId")), role: formText(formData.get("role")) });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed) };
  if (parsed.data.userId === viewer.id) return { status: "error", message: "You can't change your own role." };

  const attempt = await controlRoomLimit("role-change", 20, 15 * 60_000, viewer.id);
  if (!attempt.allowed) return tooManyAttempts;

  const supabase = getSupabaseServerClient();
  if (!supabase) return notConfigured;

  const target = await getAccountById(parsed.data.userId);
  if (!target) return roleNotSaved;

  const requested = roleFromChoice(parsed.data.role);
  if (!canChangeRole(viewer, target, requested)) return { status: "error", message: "That role change is not allowed." };

  const account = (role: typeof requested): FoundAccount => {
    const next = { ...target, role };
    return { ...next, choices: roleChoicesFor(viewer, next) };
  };
  if (target.role === requested) return { status: "success", message: "They already have that role.", account: account(requested) };

  try {
    // Only app_metadata.role changes; Supabase merges the other app_metadata keys.
    const { error } = await supabase.auth.admin.updateUserById(target.id, { app_metadata: { role: requested } });
    if (error) return roleNotSaved;
  } catch {
    return roleNotSaved;
  }

  await audit("role.change", "user", target.id, {
    actor_id: viewer.id,
    actor_email: viewer.email,
    target_email: target.email,
    from: target.role,
    to: requested,
  });
  revalidatePath("/admin/team");
  revalidatePath("/admin");
  return { status: "success", message: "Role updated. It applies on their next page load.", account: account(requested) };
}
