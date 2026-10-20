import "server-only";
import { cache } from "react";
import { journalPosts, type JournalPost } from "@/data/journal";
import type { CopyValues } from "@/lib/content-fields";
import { parseContentDocument, type ContentDocument } from "@/lib/content-validation";
import { getSupabaseServerClient } from "@/lib/supabase";

export type ContentEntry = { key: string; revision: string; document: ContentDocument };
/** Admin only. Never send these documents to the storefront: they contain drafts. */
export async function listContentEntries(): Promise<ContentEntry[] | null> {
  const db = getSupabaseServerClient();
  if (!db) return null;
  try {
    const { data, error } = await db.from("site_settings").select("key, value, updated_at").like("key", "cms:%").order("key").limit(500);
    if (error) return null;
    const entries: ContentEntry[] = [];
    for (const row of data ?? []) {
      const document = parseContentDocument(row.key, row.value, process.env.SUPABASE_URL);
      // A malformed saved document is an error, never a blank overwrite opportunity.
      if (!document) return null;
      entries.push({ key: row.key, revision: row.updated_at, document });
    }
    return entries;
  } catch { return null; }
}

/** Saved pages and posts whose draft differs from what visitors see. Admin only. */
export function unpublishedDrafts(entries: ContentEntry[]) {
  return entries
    .filter(({ document }) => !document.deleted && JSON.stringify(document.draft) !== JSON.stringify(document.published))
    .map(({ key }) => key);
}

export type PublicContent ={ pages: Record<string, CopyValues>; posts: JournalPost[] };
export function publishedContent(entries: ContentEntry[]): PublicContent {
  const pages: Record<string, CopyValues> = {};
  const posts = new Map(journalPosts.map((post) => [post.slug, post]));
  for (const { key, document } of entries) {
    if (key.startsWith("cms:page:") && document.published && !document.deleted) pages[key.slice(9)] = document.published as CopyValues;
    if (key.startsWith("cms:post:")) {
      const slug = key.slice(9);
      if (document.deleted || !document.published) posts.delete(slug);
      else posts.set(slug, document.published as JournalPost);
    }
  }
  return { pages, posts: [...posts.values()] };
}
export const getPublicContent = cache(async (): Promise<PublicContent> => {
  const entries = await listContentEntries();
  // A connected store must not resurrect deleted/unpublished starter posts
  // when its content database is unavailable.
  if (entries === null && getSupabaseServerClient()) return { pages: {}, posts: [] };
  return publishedContent(entries ?? []);
});
