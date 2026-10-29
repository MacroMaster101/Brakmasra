import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CheckoutQuoteError } from "@/lib/checkout-quote";
const mocks = vi.hoisted(() => ({ quote: vi.fn(), rate: vi.fn(), enabled: true }));
vi.mock("@/lib/checkout-quote-server", () => ({ quoteCheckout: mocks.quote }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rate }));
vi.mock("@/lib/features", () => ({ get commerceEnabled() { return mocks.enabled; } }));
import { POST } from "@/app/api/checkout/quote/route";
const valid = { currency: "USD", lines: [{ productId: "32149a77-c59f-4ee3-a45d-931fdd3ea0f0", size: "M", color: "Black", quantity: 1 }] };
const request = (body: unknown = valid, origin = "http://localhost:3000") => new NextRequest("http://localhost:3000/api/checkout/quote", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); mocks.enabled = true; mocks.rate.mockResolvedValue({ allowed: true }); mocks.quote.mockResolvedValue({ currency: "USD", subtotalMinor: 2500, lines: [] }); });
describe("read-only checkout quotes", () => {
  it("blocks launch mode and cross-origin requests before quoting", async () => {
    mocks.enabled = false; expect((await POST(request())).status).toBe(503);
    mocks.enabled = true; expect((await POST(request(valid, "https://other.test"))).status).toBe(403);
    expect(mocks.quote).not.toHaveBeenCalled();
  });
  it("rate limits quotes and rejects unsupported currencies", async () => {
    mocks.rate.mockResolvedValueOnce({ allowed: false }); expect((await POST(request())).status).toBe(429);
    expect((await POST(request({ ...valid, currency: "EUR" }))).status).toBe(400);
    expect(mocks.quote).not.toHaveBeenCalled();
  });
  it("returns validated currency quotes without accepting browser prices or caching them", async () => {
    const response = await POST(request({ ...valid, subtotalMinor: 1, exchangeRate: 999 }));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.quote).toHaveBeenCalledWith(valid);
    expect(await response.json()).toMatchObject({ quote: { subtotalMinor: 2500, currency: "USD" } });
  });
  it("shows safe availability errors and hides unexpected backend details", async () => {
    mocks.quote.mockRejectedValueOnce(new CheckoutQuoteError("This item cannot be checked out yet."));
    expect(await (await POST(request())).json()).toEqual({ message: "This item cannot be checked out yet." });
    mocks.quote.mockRejectedValueOnce(new Error("Private database detail"));
    expect(JSON.stringify(await (await POST(request())).json())).not.toContain("Private database detail");
  });
});
