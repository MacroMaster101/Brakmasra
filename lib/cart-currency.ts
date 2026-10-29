import type { CartLine } from "@/lib/cart";
import { type StoreCurrency } from "@/lib/currency";
import { priceInCurrency } from "@/lib/product-pricing";
/** Convert each unit before multiplication, matching the checkout line amounts. */
export function cartSubtotalInCurrency(lines: CartLine[], currency: StoreCurrency, rate: number | null) {
  let total = 0;
  for (const line of lines) {
    const unit = priceInCurrency(line.unitPrice, line.currency, currency, rate, line.prices);
    if (unit === null) return null;
    total += unit * line.quantity;
    if (!Number.isSafeInteger(total)) return null;
  }
  return total;
}
