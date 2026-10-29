import { convertCurrencyMinor, type StoreCurrency } from "@/lib/currency";
export const PRODUCT_CURRENCIES = ["LKR", "USD"] as const;
export const SALE_DISCOUNT_KINDS = ["none", "percent", "fixed"] as const;
export type SaleDiscountKind = (typeof SALE_DISCOUNT_KINDS)[number];
/** Integer minor units throughout. Invalid legacy discounts cannot create negative prices. */
export function salePriceMinor(price: number, kind: string | null | undefined, value: number | null | undefined): number {
  if (!Number.isSafeInteger(price) || price < 0) return 0;
  if (!Number.isSafeInteger(value) || !value || value <= 0) return price;
  if (kind === "percent" && value < 100) return Math.max(0, price - Math.round(price * value / 100));
  if (kind === "fixed" && value < price) return price - value;
  return price;
}

export function compareProductPrices(a: { price: number; currency: string; prices?: CurrencyPrices }, b: { price: number; currency: string; prices?: CurrencyPrices }, rate: number | null, target?: StoreCurrency) {
  if (!target && a.currency === b.currency) return a.price - b.price;
  const first = priceInCurrency(a.price, a.currency, target ?? "LKR", rate, a.prices);
  const second = priceInCurrency(b.price, b.currency, target ?? "LKR", rate, b.prices);
  return first !== null && second !== null ? first - second : a.currency.localeCompare(b.currency);
}

export type CurrencyPrices = Partial<Record<StoreCurrency, number>>;

/** Explicit catalog prices take precedence over exchange-rate conversion. */
export function priceInCurrency(amount: number, source: string, target: StoreCurrency, rate: number | null, prices?: CurrencyPrices): number | null {
  const custom = prices?.[target];
  return custom !== undefined && Number.isSafeInteger(custom) && custom >= 0 ? custom : convertCurrencyMinor(amount, source, target, rate);
}

/** Apply the same sale percentage to a custom alternate regular price, including fixed base discounts. */
export function alternateSalePrice(regular: number, sale: number, alternate: number, kind?: string, value?: number): number {
  if (kind === "percent") return salePriceMinor(alternate, kind, value);
  return regular > 0 ? alternate - Math.round(alternate * (regular - sale) / regular) : alternate;
}

export function alternatePrices(regular: number, sale: number, currency: string, alternate?: number | null, kind?: string, value?: number): { prices?: CurrencyPrices; compareAtPrices?: CurrencyPrices } {
  if (!Number.isSafeInteger(alternate) || !alternate || alternate < 1) return {};
  const target = currency.trim() === "USD" ? "LKR" : "USD";
  const price = alternateSalePrice(regular, sale, alternate, kind, value);
  return { prices: { [target]: price }, ...(sale < regular ? { compareAtPrices: { [target]: alternate } } : {}) };
}
