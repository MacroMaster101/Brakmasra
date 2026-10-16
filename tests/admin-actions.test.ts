import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ viewer: vi.fn(), limit: vi.fn(), db: vi.fn(), audit: vi.fn(), rpc: vi.fn(), demo: false }));
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
beforeEach(() => { vi.clearAllMocks(); mocks.demo = false; mocks.limit.mockResolvedValue({ allowed: true }); mocks.viewer.mockResolvedValue({ id, role: "web_dev" }); mocks.rpc.mockResolvedValue({ data: id, error: null }); mocks.db.mockReturnValue({ rpc: mocks.rpc }); });
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
