import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentDocument } from "@/lib/content-validation";
const mocks = vi.hoisted(() => ({ viewer: vi.fn(), limit: vi.fn(), db: vi.fn(), audit: vi.fn(), demo: false, revalidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/app/admin/action-helpers", () => ({ viewerWith: mocks.viewer, controlRoomLimit: mocks.limit, audit: mocks.audit }));
vi.mock("@/lib/supabase", () => ({ getSupabaseServerClient: mocks.db }));
vi.mock("@/lib/features", () => ({ get authDemoMode() { return mocks.demo; } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { saveContentAction } from "@/app/admin/content-actions";
import { pageDefaults, pageFieldGroup, type CopyValues } from "@/lib/content-fields";
import { journalPosts } from "@/data/journal";

type Row = { key: string; value: ContentDocument; updated_at: string };
let row: Row | null;
let writeFails = false;
function db() {
  return { from: vi.fn(() => {
    let operation = "read"; let payload: Row; const filters: Record<string,string> = {};
    const query = {
      select: () => query,
      eq: (key: string, value: string) => { filters[key] = value; return query; },
      insert: (value: Row) => { operation = "insert"; payload = value; return query; },
      update: (value: Row) => { operation = "update"; payload = value; return query; },
      maybeSingle: async () => {
        if (operation === "read") return { data: row, error: null };
        if (writeFails) return { data: null, error: { code: "connection" } };
        if (filters.updated_at !== row?.updated_at) return { data: null, error: null };
        row = { ...row!, ...payload }; return { data: { key: row.key }, error: null };
      },
      single: async () => {
        if (row) return { data: null, error: { code: "23505" } };
        if (writeFails) return { data: null, error: { code: "connection" } };
        row = payload; return { data: { key: row.key }, error: null };
      },
    };
    return query;
  }) };
}
const idle = { status: "idle" as const, message: "" };
function form(intent = "draft", revision = "", payload: unknown = pageDefaults("home"), key = "cms:page:home") {
  const f = new FormData(); for (const [name,value] of Object.entries({ intent, revision, payload: JSON.stringify(payload), key })) f.set(name,value); return f;
}
beforeEach(() => {
  vi.clearAllMocks(); row = null; writeFails = false; mocks.demo = false;
  mocks.viewer.mockResolvedValue({ id: "dev", email: "dev@example.test", role: "web_dev" });
  mocks.limit.mockResolvedValue({ allowed: true }); mocks.db.mockReturnValue(db());
});
describe("content server actions", () => {
  it("rejects unauthorized users before accessing the service database", async () => {
    mocks.viewer.mockResolvedValue(null);
    expect((await saveContentAction(idle, form())).status).toBe("error"); expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.viewer).toHaveBeenCalledWith("manage_content");
  });
  it("does not write in demo mode, with an invalid key, or over the rate limit", async () => {
    mocks.demo = true; expect((await saveContentAction(idle, form())).status).toBe("error");
    mocks.demo = false; expect((await saveContentAction(idle, form("draft", "", {}, "private:secret"))).status).toBe("error");
    mocks.limit.mockResolvedValue({ allowed: false }); expect((await saveContentAction(idle, form())).status).toBe("error");
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("creates private drafts, publishes updates, and restores default live text", async () => {
    expect((await saveContentAction(idle, form())).status).toBe("success"); expect(row!.value.published).toBeNull();
    const updated = pageDefaults("home"); updated.en[Object.keys(updated.en)[0]] = "New headline";
    expect((await saveContentAction(idle, form("publish", row!.updated_at, updated))).status).toBe("success");
    expect(row!.value.published).toEqual(updated); expect(mocks.audit).toHaveBeenCalled();
    expect((await saveContentAction(idle, form("reset", row!.updated_at))).status).toBe("success"); expect(row!.value.published).toBeNull(); expect(row!.value.draft).toEqual(updated);
  });
  it("keeps the live version when saving another draft", async () => {
    await saveContentAction(idle, form("publish")); const live = row!.value.published;
    const next = pageDefaults("home"); next.en[Object.keys(next.en)[0]] = "Not live";
    await saveContentAction(idle, form("draft", row!.updated_at, next)); expect(row!.value.published).toEqual(live);
  });
  it("blocks stale revisions and failed writes without changing content", async () => {
    await saveContentAction(idle, form()); const before = structuredClone(row);
    expect((await saveContentAction(idle, form("publish"))).status).toBe("error"); expect(row).toEqual(before);
    writeFails = true; expect((await saveContentAction(idle, form("publish", row!.updated_at))).status).toBe("error"); expect(row).toEqual(before);
  });
  it("preserves a bundled post while drafting, then supports unpublish, trash and restore", async () => {
    const post = journalPosts[0]; const key = `cms:post:${post.slug}`;
    await saveContentAction(idle, form("draft", "", post, key)); expect(row!.value.published).toEqual(post);
    await saveContentAction(idle, form("unpublish", row!.updated_at, post, key)); expect(row!.value.published).toBeNull();
    await saveContentAction(idle, form("delete", row!.updated_at, post, key)); expect(row!.value.deleted).toBe(true);
    await saveContentAction(idle, form("restore", row!.updated_at, post, key)); expect(row!.value.deleted).toBe(false); expect(row!.value.published).toBeNull();
  });
  it("refuses mismatched slugs and missing translations", async () => {
    expect((await saveContentAction(idle, form("publish", "", journalPosts[0], "cms:post:different"))).status).toBe("error");
    expect((await saveContentAction(idle, form("publish", "", { en: {} }))).status).toBe("error"); expect(row).toBeNull();
  });
});

describe("content section draft isolation", () => {
  it("saves one group without saving changes in another group or language", async () => {
    await saveContentAction(idle, form("publish"));
    const original = structuredClone(row!.value);
    const copy = pageDefaults("home");
    const keys = Object.keys(copy.en);
    const first = keys[0];
    const other = keys.find(key => pageFieldGroup(key) !== pageFieldGroup(first))!;
    expect(other).toBeTruthy();
    copy.en[first] = "Saved group"; copy.en[other] = "Unsaved group"; copy.si[first] = "Unsaved language";
    const data = form("draft", row!.updated_at, copy);
    data.set("section", `page:en:${pageFieldGroup(first)}`);
    expect((await saveContentAction(idle, data)).status).toBe("success");
    const draft = row!.value.draft as CopyValues;
    expect(draft.en[first]).toBe("Saved group");
    expect(draft.en[other]).toBe((original.draft as CopyValues).en[other]);
    expect(draft.si).toEqual((original.draft as CopyValues).si);
    expect(row!.value.published).toEqual(original.published);
  });
  it("preserves story body and other language when saving its introduction", async () => {
    const post = structuredClone(journalPosts[0]); const key = `cms:post:${post.slug}`;
    const before = structuredClone(post);
    post.copy.en.title = "Saved introduction"; post.copy.en.sections[0].heading = "Not saved"; post.copy.si.title = "Not saved";
    const data = form("draft", "", post, key); data.set("section", "story:en:summary");
    expect((await saveContentAction(idle, data)).status).toBe("success");
    const draft = row!.value.draft as typeof post;
    expect(draft.copy.en.title).toBe("Saved introduction");
    expect(draft.copy.en.sections).toEqual(before.copy.en.sections);
    expect(draft.copy.si).toEqual(before.copy.si);
    expect(row!.value.published).toEqual(before);
  });
  it("rejects unknown groups and disallows publishing through a section action", async () => {
    const data = form(); data.set("section", "page:en:__proto__");
    expect((await saveContentAction(idle, data)).status).toBe("error");
    data.set("section", "page:en:home"); data.set("intent", "publish");
    expect((await saveContentAction(idle, data)).status).toBe("error");
    expect(row).toBeNull();
  });
});
