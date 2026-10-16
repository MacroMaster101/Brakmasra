import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase", () => ({ getSupabaseServerClient: () => null }));
import { CONTENT_PAGES, pageDefaults, replaceText } from "@/lib/content-fields";
import { contentKeySchema, isContentImage, parseContentDocument, postSchema, validatePageCopy } from "@/lib/content-validation";
import { publishedContent } from "@/lib/content";
import { journalPosts } from "@/data/journal";

describe("website content validation", () => {
  it("accepts each existing page in both languages", () => {
    for (const page of CONTENT_PAGES) expect(validatePageCopy(page.id, pageDefaults(page.id)), page.id).not.toBeNull();
  });
  it("rejects extra keys, missing language text, and script image sources", () => {
    const values = pageDefaults("about");
    expect(validatePageCopy("about", { ...values, en: { ...values.en, "text.role": "web_dev" } })).toBeNull();
    expect(validatePageCopy("about", { en: values.en })).toBeNull();
    expect(validatePageCopy("about", { ...values, en: { ...values.en, "image.hero": "javascript:alert(1)" } })).toBeNull();
    for (const src of ["//evil.test/a.jpg", "data:image/svg+xml,<svg>", "/images/../secret.webp", "https://evil.test/a.webp"])
      expect(isContentImage(src, "https://store.supabase.co")).toBe(false);
    expect(isContentImage("https://store.supabase.co/storage/v1/object/public/product-images/a.webp", "https://store.supabase.co")).toBe(true);
  });
  it("only replaces existing text leaves and keeps function-valued translations", () => {
    const hello = () => "Hello";
    expect(replaceText({ heading: "Old", list: ["one"], hello }, { heading: "<script>text only</script>", "list.0": "New", "__proto__.admin": "true", hello: "bad" }))
      .toEqual({ heading: "<script>text only</script>", list: ["New"], hello });
  });
  it("accepts real stories and rejects incomplete copy and route injection", () => {
    for (const post of journalPosts) expect(postSchema.safeParse(post).success).toBe(true);
    expect(postSchema.safeParse({ ...journalPosts[0], copy: { en: journalPosts[0].copy.en } }).success).toBe(false);
    for (const key of ["cms:page:../auth", "other:page:home", "cms:post:../admin"]) expect(contentKeySchema.safeParse(key).success).toBe(false);
  });
});

describe("published content boundary", () => {
  const post = journalPosts[0];
  const row = (published: typeof post | null, deleted = false) => ({ key: `cms:post:${post.slug}`, revision: "2026-10-16T10:00:00Z", document: { version: 1 as const, draft: { ...post, copy: { ...post.copy, en: { ...post.copy.en, title: "PRIVATE DRAFT" } } }, published, deleted } });
  it("never leaks draft posts or page text into the public payload", () => {
    const content = publishedContent([row(post), { key: "cms:page:home", revision: "", document: { version: 1, draft: pageDefaults("home"), published: null, deleted: false } }]);
    expect(JSON.stringify(content)).not.toContain("PRIVATE DRAFT");
    expect(content.pages).toEqual({});
    expect(content.posts[0].copy.en.title).toBe(post.copy.en.title);
  });
  it("removes unpublished and trashed bundled stories instead of restoring static defaults", () => {
    expect(publishedContent([row(null)]).posts.some((item) => item.slug === post.slug)).toBe(false);
    expect(publishedContent([row(post, true)]).posts.some((item) => item.slug === post.slug)).toBe(false);
  });
  it("refuses a malformed saved document or a key that disagrees with its slug", () => {
    expect(parseContentDocument(`cms:post:${post.slug}`, row(post).document)).not.toBeNull();
    expect(parseContentDocument("cms:post:another-slug", row(post).document)).toBeNull();
    expect(parseContentDocument(`cms:post:${post.slug}`, { ...row(post).document, version: 2 })).toBeNull();
  });
});
