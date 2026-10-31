import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ viewer: vi.fn(), limit: vi.fn(), db: vi.fn(), audit: vi.fn(), rpc: vi.fn(), from: vi.fn(), demo: false }));
vi.mock("server-only", () => ({}));
vi.mock("@/app/admin/action-helpers", () => ({ viewerWith: mocks.viewer, controlRoomLimit: mocks.limit, audit: mocks.audit }));
vi.mock("@/lib/supabase", () => ({ getSupabaseServerClient: mocks.db }));
vi.mock("@/lib/store", () => ({ CATALOG_TAG: "catalog" }));
vi.mock("@/lib/control-room", () => ({ findAccountByEmail: vi.fn(), getAccountById: vi.fn() }));
vi.mock("@/lib/features", () => ({ get authDemoMode() { return mocks.demo; } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
import * as store from "@/app/admin/store-actions";
import * as people from "@/app/admin/actions";
const idle = { status: "idle" as const, message: "" };
const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => { vi.clearAllMocks(); mocks.demo = false; mocks.limit.mockResolvedValue({ allowed: true }); mocks.viewer.mockResolvedValue({ id, role: "web_dev" }); mocks.rpc.mockResolvedValue({ data: id, error: null }); mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { slug: "original-product" }, error: null }) }) }) }); mocks.db.mockReturnValue({ rpc: mocks.rpc, from: mocks.from }); });
function form(values: Record<string,string>) { const data = new FormData(); Object.entries(values).forEach(([k,v]) => data.set(k,v)); return data; }
describe("management action authorization", () => {
  for (const [name, action] of Object.entries(store)) {
    it(`blocks ${name} before any privileged data access`, async () => {
      mocks.viewer.mockResolvedValue(null);
      const result = await (action as (state: typeof idle, data: FormData) => Promise<{status:string}>)(idle,new FormData());
      expect(result.status).toBe("error"); expect(mocks.db).not.toHaveBeenCalled(); expect(mocks.viewer).toHaveBeenCalledWith(name === "updateOrderAction" ? "manage_orders" : "manage_catalog");
    });
  }
  for (const [name, action] of Object.entries(people)) {
    it(`blocks ${name} before accessing people data`, async () => {
      mocks.viewer.mockResolvedValue(null); expect((await action(idle,new FormData())).status).toBe("error"); expect(mocks.db).not.toHaveBeenCalled();
    });
  }
  it("does not persist preview-mode actions or rate-limited writes", async () => {
    mocks.demo = true; expect((await store.saveProductAction(idle,new FormData())).message).toContain("not saved");
    mocks.demo = false; mocks.limit.mockResolvedValue({ allowed: false }); expect((await store.saveProductAction(idle,new FormData())).status).toBe("error"); expect(mocks.db).not.toHaveBeenCalled();
  });
});
describe("atomic management actions", () => {
  const product = () => form({ id, name: "Test Tee", slug: "test-tee", status: "draft", category: "Apparel", badge: "", position: "0", price: "6900", description: "A test product description.", fabric: "Cotton", sizes: "M", colors: "Black", "stock:M|Black": "4" });
  it("saves product and stock in a single RPC with server-validated rupee pricing", async () => {
    expect((await store.saveProductAction(idle,product())).status).toBe("success");
    expect(mocks.rpc).toHaveBeenCalledWith("admin_save_product", expect.objectContaining({ p_id: id, p_product: expect.objectContaining({ price_minor: 690000, status: "draft" }), p_variants: [{ size: "M", color: "Black", inventory: 4 }] }));
  });
  it("does not report success on a failed transaction or duplicate product slug", async () => {
    mocks.rpc.mockResolvedValueOnce({ data:null,error:{code:"23505"} }); expect((await store.saveProductAction(idle,product())).message).toContain("already uses");
    mocks.rpc.mockResolvedValueOnce({ data:null,error:{code:"connection"} }); expect((await store.saveProductAction(idle,product())).status).toBe("error"); expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("rejects malformed stock before executing an RPC", async () => {
    const data=product(); data.set("stock:M|Black","-1"); expect((await store.saveProductAction(idle,data)).status).toBe("error"); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("saves collection membership atomically and reports missing product references", async () => {
    const data=form({ id, name:"Test collection",slug:"test-collection",description:"Description" }); data.append("productIds",id);
    expect((await store.saveCollectionAction(idle,data)).status).toBe("success"); expect(mocks.rpc).toHaveBeenCalledWith("admin_save_collection",expect.objectContaining({ p_id:id }));
    mocks.rpc.mockResolvedValueOnce({ data:null,error:{code:"23503"} }); expect((await store.saveCollectionAction(idle,data)).message).toContain("no longer exists");
  });
  it("moves photo order in one transaction and logs the change", async () => {
    expect((await store.moveProductImageAction(idle,form({ id,direction:"down" }))).status).toBe("success");
    expect(mocks.rpc).toHaveBeenCalledWith("admin_move_product_image",{ p_id:id,p_direction:"down" }); expect(mocks.audit).toHaveBeenCalled();
  });
});

describe("independent catalog sections", () => {
  it("saves details without requiring basics or submitting inventory", async () => {
    const data = form({ id, section: "details", description: "A standalone description.", fabric: "Cotton", care: "Cold wash", price: "bad", "stock:M|Black": "-99" });
    expect((await store.saveProductSectionAction(idle, data)).status).toBe("success");
    expect(mocks.rpc).toHaveBeenCalledWith("admin_save_product_section", { p_id: id, p_section: "details", p_patch: { description: "A standalone description.", fabric: "Cotton", care: ["Cold wash"] } });
  });
  it("saves inventory without accepting unrelated text fields", async () => {
    const data = form({ id, section: "stock", sizes: "M", colors: "Black", "stock:M|Black": "6", name: "Must not change" });
    expect((await store.saveProductSectionAction(idle, data)).status).toBe("success");
    expect(mocks.rpc).toHaveBeenCalledWith("admin_save_product_section", { p_id: id, p_section: "stock", p_patch: { variants: [{ size: "M", color: "Black", inventory: 6 }] } });
  });
  it("rejects unknown sections and invalid section data without writing", async () => {
    for (const section of ["__proto__", "constructor", "everything", "details"]) {
      expect((await store.saveProductSectionAction(idle, form({ id, section, description: "short" }))).status).toBe("error");
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("saves only collection membership and permits clearing the selection", async () => {
    expect((await store.saveCollectionSectionAction(idle, form({ id, section: "products", name: "Ignore me" }))).status).toBe("success");
    expect(mocks.rpc).toHaveBeenCalledWith("admin_save_collection_section", { p_id: id, p_section: "products", p_patch: { productIds: [] } });
  });
  it("rejects failed section transactions without a success audit", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "failure" } });
    expect((await store.saveProductSectionAction(idle, form({ id, section: "sinhala" }))).status).toBe("error");
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});

describe("product price sections", () => {
  it("saves both the currency and validated sale discount in the pricing section", async () => {
    expect((await store.saveProductSectionAction(idle, form({ id, section: "pricing", currency: "USD", price: "25", discountKind: "fixed", discountValue: "5", name: "Do not save" }))).status).toBe("success");
    expect(mocks.rpc).toHaveBeenCalledWith("admin_save_product_section", { p_id: id, p_section: "pricing", p_patch: { currency: "USD", price_minor: 2500, alternate_price_minor: null, discount_kind: "fixed", discount_value: 500 } });
  });
});

describe("role-aware product addresses", () => {
  const basics = (extra: Record<string, string> = {}) => form({ id, section: "basics", name: "Renamed Product", slug: "forged-url", status: "active", category: "Apparel", badge: "", ...extra });
  const newProduct = (extra: Record<string, string> = {}) => form({ name: "New Tee", slug: "forged-url", status: "draft", category: "Apparel", badge: "", price: "2000", description: "A new cotton graphic tee.", sizes: "M", colors: "Black", "stock:M|Black": "3", ...extra });
  it("generates owner-created addresses and ignores forged custom controls", async () => {
    mocks.viewer.mockResolvedValue({ id, role: "owner" });
    await expect(store.saveProductAction(idle, newProduct({ slugMode: "custom", regenerateSlug: "on" }))).rejects.toThrow(`REDIRECT:/admin/products/${id}`);
    expect(mocks.rpc).toHaveBeenCalledWith("admin_save_product", expect.objectContaining({ p_product: expect.objectContaining({ slug: "new-tee" }) }));
  });
  it("returns the new product instead of redirecting when photos are waiting to upload", async () => {
    mocks.viewer.mockResolvedValue({ id, role: "owner" });
    expect(await store.saveProductAction(idle, newProduct({ deferRedirect: "1" }))).toEqual({ status: "success", message: "Product saved.", productId: id });
  });
  it("adds a suffix after an automatic address collision", async () => {
    mocks.viewer.mockResolvedValue({ id, role: "owner" });
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "23505" } });
    await expect(store.saveProductAction(idle, newProduct())).rejects.toThrow("REDIRECT:");
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc.mock.calls[1][1].p_product.slug).toMatch(/^new-tee-[a-f0-9]{6}$/);
  });
  it("keeps owner product links stable and omits slug from the section patch", async () => {
    mocks.viewer.mockResolvedValue({ id, role: "owner" });
    expect((await store.saveProductSectionAction(idle, basics({ slugMode: "custom", regenerateSlug: "on" }))).status).toBe("success");
    const patch = mocks.rpc.mock.calls[0][1].p_patch;
    expect(patch.name).toBe("Renamed Product");
    expect(patch).not.toHaveProperty("slug");
  });
  it("protects existing addresses even on an owner's full product save", async () => {
    mocks.viewer.mockResolvedValue({ id, role: "owner" });
    expect((await store.saveProductAction(idle, newProduct({ id, slugMode: "custom" }))).status).toBe("success");
    expect(mocks.rpc.mock.calls[0][1].p_product.slug).toBe("original-product");
  });
  it("allows Web Dev to choose a custom address, with duplicate errors preserved", async () => {
    expect((await store.saveProductSectionAction(idle, basics({ slugMode: "custom", slug: "custom-tee" }))).status).toBe("success");
    expect(mocks.rpc.mock.calls[0][1].p_patch.slug).toBe("custom-tee");
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "23505" } });
    expect((await store.saveProductSectionAction(idle, basics({ slugMode: "custom" }))).message).toContain("already uses");
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
  it("requires explicit regeneration before Web Dev automatic mode changes an existing link", async () => {
    expect((await store.saveProductSectionAction(idle, basics({ slugMode: "auto" }))).status).toBe("success");
    expect(mocks.rpc.mock.calls[0][1].p_patch).not.toHaveProperty("slug");
    expect((await store.saveProductSectionAction(idle, basics({ slugMode: "auto", regenerateSlug: "on" }))).status).toBe("success");
    expect(mocks.rpc.mock.calls[1][1].p_patch.slug).toBe("renamed-product");
  });
  it("rejects an explicit empty custom address instead of silently creating a different link", async () => {
    expect((await store.saveProductSectionAction(idle, basics({ slugMode: "custom", slug: "" }))).status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not overwrite an existing address if the trusted lookup fails", async () => {
    mocks.viewer.mockResolvedValue({ id, role: "owner" });
    mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: "failure" } }) }) }) });
    expect((await store.saveProductSectionAction(idle, basics())).status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
