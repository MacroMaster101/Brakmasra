import { NextResponse, type NextRequest } from "next/server";
import { CheckoutQuoteError, checkoutSchema } from "@/lib/checkout-quote";
import { quoteCheckout } from "@/lib/checkout-quote-server";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBody, requestKey, sameOrigin } from "@/lib/request";
import { commerceEnabled } from "@/lib/features";

export async function POST(request: NextRequest) {
  if (!commerceEnabled) {
    return NextResponse.json({ message: "Ordering is coming soon." }, { status: 503 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > 16_384) {
    return NextResponse.json({ message: "Request too large." }, { status: 413 });
  }
  if (!(await rateLimit(requestKey(request, "checkout"), 8, 10 * 60_000)).allowed) {
    return NextResponse.json({ message: "Too many checkout attempts. Please wait." }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await readJsonBody(request, 16_384));
  if (!parsed.success) {
    return NextResponse.json({ message: "Your cart could not be validated." }, { status: 400 });
  }
  let quote;
  try { quote = await quoteCheckout(parsed.data); }
  catch (error) { return NextResponse.json({ message: error instanceof CheckoutQuoteError ? error.message : "Your cart could not be validated." }, { status: 409 }); }
  if (!process.env.DATABASE_URL || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Secure checkout is not configured yet.", quote }, { status: 503 });
  }

  // The production adapter must reload price and inventory by variant ID,
  // reserve stock transactionally, and create an idempotent provider session.
  return NextResponse.json({ message: "Payment adapter is ready to be connected.", quote }, { status: 501 });
}
