import { NextResponse, type NextRequest } from "next/server";
import { CheckoutQuoteError, checkoutSchema } from "@/lib/checkout-quote";
import { quoteCheckout } from "@/lib/checkout-quote-server";
import { commerceEnabled } from "@/lib/features";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBody, requestKey, sameOrigin } from "@/lib/request";
export async function POST(request: NextRequest) {
  if (!commerceEnabled) return NextResponse.json({ message: "Ordering is coming soon." }, { status: 503 });
  if (!sameOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  if (!(await rateLimit(requestKey(request, "checkout-quote"), 40, 10 * 60_000)).allowed) return NextResponse.json({ message: "Too many checkout attempts. Please wait." }, { status: 429 });
  const parsed = checkoutSchema.safeParse(await readJsonBody(request, 16_384));
  if (!parsed.success) return NextResponse.json({ message: "Your cart could not be validated." }, { status: 400 });
  try { return NextResponse.json({ quote: await quoteCheckout(parsed.data) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ message: error instanceof CheckoutQuoteError ? error.message : "Prices could not be checked. Please try again." }, { status: 409 }); }
}
