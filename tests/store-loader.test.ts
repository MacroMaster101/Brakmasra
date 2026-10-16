import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), result: { data: [] as unknown[], error: null as unknown }, eq: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/supabase", () => ({ getSupabaseServerClient: mocks.client }));
import { getCatalog, getCatalogCollections } from "@/lib/store";
import { products } from "@/data/products";
beforeEach(() => {
  mocks.result = { data: [], error: null }; mocks.eq.mockClear();
  const query = { select: () => query, eq: (key: string, value: unknown) => { mocks.eq(key,value); return query; }, order: () => query, limit: async () => mocks.result };
  mocks.client.mockReturnValue({ from: () => query });
});
describe("merchant catalogue changes", () => {
  it("keeps an intentionally empty live catalogue empty", async () => {
    expect(await getCatalog()).toEqual([]); expect(mocks.eq).toHaveBeenCalledWith("status","active");
  });
  it("does not resurrect bundled products during a database failure", async () => {
    mocks.result.error = { code:"connection" }; expect(await getCatalog()).toEqual([]);
  });
  it("uses starter products only when the database is not configured", async () => {
    mocks.client.mockReturnValue(null); expect(await getCatalog()).toEqual(products);
  });
  it("loads active collections in their merchant-selected product order", async () => {
    mocks.result.data = [{ slug:"first-drop",name:"First drop",description:null,collection_products:[{ product_id:"b",position:1 },{ product_id:"a",position:0 }] }];
    expect(await getCatalogCollections()).toEqual([{ slug:"first-drop",name:"First drop",description:"",productIds:["a","b"] }]); expect(mocks.eq).toHaveBeenCalledWith("active",true);
  });
});
