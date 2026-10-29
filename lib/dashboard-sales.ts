import type { DayPoint } from "@/lib/dashboard-series";

export type ProductSale = { day: string; productId: string; name: string; href: string | null; image: string | null; quantity: number };
export type RankedProduct = Omit<ProductSale, "day">;

/** Rank actual paid quantities in the selected store-day window, across variants. */
export function rankProducts(sales: ProductSale[], days: DayPoint[]): RankedProduct[] {
  const window = new Set(days.map(point => point.day));
  const totals = new Map<string, RankedProduct>();
  for (const sale of sales) {
    if (!window.has(sale.day) || !Number.isSafeInteger(sale.quantity) || sale.quantity <= 0) continue;
    const current = totals.get(sale.productId);
    if (current) current.quantity += sale.quantity;
    else totals.set(sale.productId, { productId: sale.productId, name: sale.name, href: sale.href, image: sale.image, quantity: sale.quantity });
  }
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)).slice(0, 6);
}
