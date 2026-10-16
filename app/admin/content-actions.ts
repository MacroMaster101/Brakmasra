"use server";
import { revalidatePath } from "next/cache";
import { audit, controlRoomLimit, viewerWith } from "@/app/admin/action-helpers";
import type { ControlRoomActionState } from "@/app/admin/actions";
import { journalPosts } from "@/data/journal";
import { formText } from "@/lib/account-validation";
import { pageDefinition } from "@/lib/content-fields";
import { contentKeySchema, isContentImage, parseContentDocument, postSchema, revisionSchema, validatePageCopy, type ContentDocument } from "@/lib/content-validation";
import { authDemoMode } from "@/lib/features";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function saveContentAction(_state: ControlRoomActionState, form: FormData): Promise<ControlRoomActionState> {
  const viewer = await viewerWith("manage_site");
  if (!viewer) return { status: "error", message: "This action is not available." };
  if (authDemoMode) return { status: "error", message: "Preview mode. Changes are not saved." };
  const key = contentKeySchema.safeParse(formText(form.get("key")));
  const revision = revisionSchema.safeParse(formText(form.get("revision")));
  const intent = formText(form.get("intent"));
  if (!key.success || !revision.success || !["draft", "publish", "unpublish", "delete", "restore", "reset"].includes(intent))
    return { status: "error", message: "Check the form and try again." };
  const attempt = await controlRoomLimit("content-save", 60, 10 * 60_000, viewer.id);
  if (!attempt.allowed) return { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
  const db = getSupabaseServerClient();
  if (!db) return { status: "error", message: "Control Room data is not connected yet." };
  const page = key.data.startsWith("cms:page:") ? pageDefinition(key.data.slice(9)) : undefined;
  if (key.data.startsWith("cms:page:") && !page) return { status: "error", message: "Unknown page." };
  if (page && ["delete", "restore", "unpublish"].includes(intent)) return { status: "error", message: "Use Restore defaults for an existing website page." };
  try {
    const current = await db.from("site_settings").select("value, updated_at").eq("key", key.data).maybeSingle();
    if (current.error) throw new Error();
    if ((current.data?.updated_at ?? "") !== revision.data) return { status: "error", message: "Someone changed this content. Reload before saving so their changes are kept." };
    const bundled = journalPosts.find((post) => key.data === `cms:post:${post.slug}`);
    const previous = current.data ? parseContentDocument(key.data, current.data.value, process.env.SUPABASE_URL) : bundled ? { version: 1 as const, draft: bundled, published: bundled, deleted: false } : null;
    if (current.data && !previous) throw new Error();
    let document: ContentDocument;
    if (["delete", "restore", "unpublish", "reset"].includes(intent)) {
      if (!previous) return { status: "error", message: "Save a draft first." };
      document = { ...previous };
      if (intent === "delete") { document.deleted = true; document.published = null; }
      if (intent === "restore") document.deleted = false;
      if (intent === "unpublish" || intent === "reset") document.published = null;
    } else {
      const raw = formText(form.get("payload"));
      if (raw.length > 250_000) return { status: "error", message: "This document is too large." };
      const input: unknown = JSON.parse(raw);
      const draft = page ? validatePageCopy(page.id, input, process.env.SUPABASE_URL) : postSchema.safeParse(input);
      const parsedPost = !page && draft && "success" in draft ? draft : null;
      const content = page ? draft : parsedPost?.success ? parsedPost.data : null;
      if (!content || (!page && (!parsedPost?.success || !isContentImage(parsedPost.data.image, process.env.SUPABASE_URL) || key.data !== `cms:post:${parsedPost.data.slug}`)))
        return { status: "error", message: "Complete the required fields. Use an existing website image or a product image from this site's storage." };
      document = { version: 1, draft: content as ContentDocument["draft"], published: intent === "publish" ? content as ContentDocument["draft"] : previous?.published ?? null, deleted: false };
    }
    // Compare-and-swap guards two editors saving at once. New documents use INSERT,
    // so a duplicate slug cannot silently replace an existing post.
    const timestamp = new Date().toISOString();
    const saved = revision.data
      ? await db.from("site_settings").update({ value: document, updated_at: timestamp }).eq("key", key.data).eq("updated_at", revision.data).select("key").maybeSingle()
      : await db.from("site_settings").insert({ key: key.data, value: document, updated_at: timestamp }).select("key").single();
    if (saved.error?.code === "23505" || (!saved.error && !saved.data)) return { status: "error", message: "Someone changed this content. Reload before saving so their changes are kept." };
    if (saved.error) throw new Error();
    await audit(viewer, `content.${intent}`, page ? "page" : "post", key.data);
    revalidatePath("/", "layout");
    return { status: "success", message: intent === "publish" ? "Published. Your changes are live." : intent === "draft" ? "Draft saved. The live website is unchanged." : intent === "delete" ? "Post moved to trash. You can restore it here." : intent === "restore" ? "Post restored as a draft." : intent === "reset" ? "Default website text restored. Your draft is kept." : "Post unpublished. Your draft is kept." };
  } catch { return { status: "error", message: "Content could not be saved. Please try again." }; }
}
