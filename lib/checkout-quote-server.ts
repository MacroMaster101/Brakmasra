import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getUsdRate } from "@/lib/exchange-rates";
import { CheckoutQuoteError, buildCheckoutQuote, type CheckoutInput, type QuoteProduct } from "@/lib/checkout-quote";
/** Never accept browser prices, discount amounts or exchange rates as authoritative. */
export async function quoteCheckout(input: CheckoutInput) {
  const db = getSupabaseServerClient();
  if (!db) throw new CheckoutQuoteError("Secure checkout is not configured yet.");
  const { data, error } = await db.from("products").select("id,name,status,currency,price_minor,alternate_price_minor,discount_kind,discount_value,coming_soon,product_variants(id,size,color,inventory,active)").in("id", [...new Set(input.lines.map(line => line.productId))]);
  if (error || !data) throw new CheckoutQuoteError("Prices could not be checked. Please try again.");
  const needsRate = data.some(product => product.currency.trim() !== input.currency && product.alternate_price_minor == null);
  return buildCheckoutQuote(input, data as unknown as QuoteProduct[], needsRate ? await getUsdRate() : null);
}
