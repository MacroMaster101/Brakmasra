import { z } from "zod";
import { PRODUCT_CURRENCIES, alternatePrices, priceInCurrency, salePriceMinor } from "@/lib/product-pricing";
export class CheckoutQuoteError extends Error {}
export const checkoutSchema = z.object({
  currency: z.enum(PRODUCT_CURRENCIES).default("LKR"),
  lines: z.array(z.object({ productId: z.string().uuid(), size: z.string().max(32), color: z.string().max(64), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
});
export type CheckoutInput = z.output<typeof checkoutSchema>;
export type QuoteProduct = {
  id: string; name: string; status: string; currency: string; price_minor: number; alternate_price_minor?: number | null; discount_kind?: string; discount_value?: number; coming_soon?: boolean;
  product_variants: { id: string; size: string | null; color: string | null; inventory: number; active: boolean }[];
};
export type CheckoutQuote = { currency: CheckoutInput["currency"]; subtotalMinor: number; lines: { variantId: string; name: string; quantity: number; unitPriceMinor: number; totalMinor: number }[] };
export function buildCheckoutQuote(input: CheckoutInput, products: QuoteProduct[], rate: number | null): CheckoutQuote {
  const grouped = new Map<string, { productId: string; size: string; color: string; quantity: number }>();
  for (const line of input.lines) {
    const key = JSON.stringify([line.productId, line.size, line.color]);
    const previous = grouped.get(key);
    grouped.set(key, { ...line, quantity: (previous?.quantity ?? 0) + line.quantity });
  }
  const lines = [...grouped.values()].map(line => {
    const product = products.find(product => product.id === line.productId);
    const variant = product?.product_variants.find(variant => variant.active && (variant.size ?? "") === line.size && (variant.color ?? "") === line.color);
    if (!product || product.status !== "active" || product.coming_soon || !variant || line.quantity > 10 || variant.inventory < line.quantity) throw new CheckoutQuoteError("Some items are unavailable or have insufficient stock. Update your cart.");
    const price = salePriceMinor(product.price_minor, product.discount_kind, product.discount_value);
    const unitPriceMinor = priceInCurrency(price, product.currency.trim(), input.currency, rate, alternatePrices(product.price_minor, price, product.currency, product.alternate_price_minor, product.discount_kind, product.discount_value).prices);
    if (unitPriceMinor === null) throw new CheckoutQuoteError("Currency conversion is unavailable. Please try again later.");
    if (unitPriceMinor <= 0) throw new CheckoutQuoteError("This item cannot be checked out yet.");
    return { variantId: variant.id, name: product.name, quantity: line.quantity, unitPriceMinor, totalMinor: unitPriceMinor * line.quantity };
  });
  const subtotalMinor = lines.reduce((total, line) => total + line.totalMinor, 0);
  if (!Number.isSafeInteger(subtotalMinor)) throw new CheckoutQuoteError("Your cart could not be validated.");
  return { currency: input.currency, subtotalMinor, lines };
}
