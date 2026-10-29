import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { rankProducts, type ProductSale } from "@/lib/dashboard-sales";
import { BarChart } from "@/components/control-room/charts";
import { translations } from "@/lib/i18n";
import { TopProducts, RecentOrders } from "@/components/control-room/overview-commerce";
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en" }) }));
const sale = (productId: string, quantity: number, day = "2026-10-23"): ProductSale => ({ productId, name: productId, quantity, day, image: null, href: null });
describe("dashboard product ranking", () => {
  it("combines quantities across variants, excludes outside days and invalid units, and ranks by sold units", () => {
    const products = rankProducts([sale("A", 2), sale("B", 4), sale("A", 3), sale("C", 99, "2026-10-01"), sale("D", -2), sale("E", 1.5)], [{ day: "2026-10-23", value: 2 }]);
    expect(products.map(product => [product.productId, product.quantity])).toEqual([["A", 5], ["B", 4]]);
  });
  it("limits to six ranked products and never invents sales for an empty period", () => {
    expect(rankProducts([], [])).toEqual([]);
    expect(rankProducts(Array.from({ length: 8 }, (_, i) => sale(String(i), i + 1)), [{ day: "2026-10-23", value: 1 }])).toHaveLength(6);
  });
});
describe("combined revenue and order chart", () => {
  it("aligns series by day and keeps currency and order counts separately readable", () => {
    const html = renderToStaticMarkup(<BarChart points={[{day:"2026-10-22",value:2500},{day:"2026-10-23",value:0}]} title="Revenue" empty="Empty" format={value=>`LKR ${value}`} secondary={{title:"Orders",points:[{day:"2026-10-23",value:3},{day:"2026-10-22",value:1}]}} />);
    expect(html).toContain("cr-secondary-line");
    expect(html).toContain("LKR 2500</td><td>Orders: 1");
    expect(html).toContain("LKR 0</td><td>Orders: 3");
    expect(html).not.toMatch(/NaN|Infinity/);
  });
  it("still displays order activity when revenue is zero", () => {
    const html = renderToStaticMarkup(<BarChart points={[{day:"2026-10-23",value:0}]} title="Revenue" empty="No activity" format={String} secondary={{title:"Orders",points:[{day:"2026-10-23",value:2}]}} />);
    expect(html).toContain("cr-secondary-line"); expect(html).not.toContain("No activity");
  });
});

describe("overview commerce cards", () => {
  it("preserves each recent order's currency, status and detail link", () => {
    const html = renderToStaticMarkup(<RecentOrders orders={[{ publicId: "ORDER-USD", customerEmail: "buyer@example.com", currency: "USD", totalMinor: 2500, status: "paid", createdAt: "2026-10-23T06:00:00Z" }]} />);
    expect(html).toContain("/admin/orders/ORDER-USD");
    expect(html).toContain("USD"); expect(html).toContain("25.00");
    expect(html).toContain(translations.en.accountOrderStatusPaid);
  });
  it("distinguishes no sales from unavailable sales instead of inventing rankings", () => {
    const empty = renderToStaticMarkup(<TopProducts products={[]} days={7} />);
    const unavailable = renderToStaticMarkup(<TopProducts products={null} days={7} />);
    expect(empty).toContain(translations.en.crSalesEmpty);
    expect(unavailable).toContain(translations.en.crLoadErrorTitle.replaceAll("'", "&#x27;"));
    expect(empty).not.toContain("cr-top-products");
  });
});
