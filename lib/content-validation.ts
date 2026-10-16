import { z } from "zod";
import { pageDefaults, pageDefinition, type ContentPageId, type CopyValues } from "@/lib/content-fields";
import type { JournalPost } from "@/data/journal";

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.").max(80);
export const contentKeySchema = z.string().regex(/^cms:(?:page:[a-z]+|post:[a-z0-9]+(?:-[a-z0-9]+)*)$/).max(100);
export const revisionSchema = z.string().datetime({ offset: true }).or(z.literal(""));
const text = (max: number) => z.string().trim().min(1, "Complete every required field.").max(max);
export const articleCopySchema = z.object({
  title: text(160), excerpt: text(500), imageAlt: text(200), lead: text(2000),
  sections: z.array(z.object({ heading: text(160), paragraphs: z.array(text(5000)).min(1).max(20) })).min(1).max(20),
});
export const postSchema = z.object({
  slug, category: z.enum(["style", "artwork", "care"]),
  image: z.string().max(1000), width: z.number().int().min(1).max(10000), height: z.number().int().min(1).max(10000),
  productSlug: slug.or(z.literal("")), copy: z.object({ en: articleCopySchema, si: articleCopySchema }),
});

export function isContentImage(value: string, supabaseUrl?: string) {
  if (/^\/images\/[a-zA-Z0-9/_-]+\.(webp|png|jpe?g|avif)$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return Boolean(supabaseUrl && url.origin === new URL(supabaseUrl).origin && url.protocol === "https:"
      && url.pathname.startsWith("/storage/v1/object/public/product-images/") && !url.username && !url.password);
  } catch { return false; }
}

export function validatePageCopy(id: ContentPageId, value: unknown, supabaseUrl?: string): CopyValues | null {
  const result = z.object({ en: z.record(z.string(), z.string().trim().min(1).max(10000)), si: z.record(z.string(), z.string().trim().min(1).max(10000)) }).safeParse(value);
  if (!result.success) return null;
  const defaults = pageDefaults(id);
  for (const lang of ["en", "si"] as const) {
    const keys = Object.keys(defaults[lang]);
    if (Object.keys(result.data[lang]).length !== keys.length || keys.some((key) => !Object.hasOwn(result.data[lang], key))) return null;
    if (keys.some((key) => key.startsWith("image.") && !isContentImage(result.data[lang][key], supabaseUrl))) return null;
  }
  return result.data;
}

export type ContentDocument = {
  version: 1; draft: CopyValues | JournalPost; published: CopyValues | JournalPost | null; deleted: boolean;
};
export function parseContentDocument(key: string, value: unknown, supabaseUrl?: string): ContentDocument | null {
  if (!contentKeySchema.safeParse(key).success || !value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (row.version !== 1 || typeof row.deleted !== "boolean") return null;
  const validate = (input: unknown) => {
    if (key.startsWith("cms:page:")) {
      const page = pageDefinition(key.slice(9));
      return page ? validatePageCopy(page.id, input, supabaseUrl) : null;
    }
    const post = postSchema.safeParse(input);
    return post.success && key === `cms:post:${post.data.slug}` && isContentImage(post.data.image, supabaseUrl) ? post.data : null;
  };
  const draft = validate(row.draft);
  const published = row.published === null ? null : validate(row.published);
  if (!draft || (row.published !== null && !published)) return null;
  return { version: 1, draft, published, deleted: row.deleted };
}
