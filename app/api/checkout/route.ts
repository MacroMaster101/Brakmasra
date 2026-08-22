import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { requestKey, sameOrigin } from "@/lib/request";

const schema = z.object({ lines: z.array(z.object({ productId: z.string().uuid(), size: z.string().max(32), color: z.string().max(64), quantity: z.number().int().min(1).max(10) })).min(1).max(30) });

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  if (!rateLimit(requestKey(request, "checkout"), 8, 10 * 60_000).allowed) return NextResponse.json({ message: "Too many checkout attempts. Please wait." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Your cart could not be validated." }, { status: 400 });
  if (!process.env.DATABASE_URL || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ message: "Secure checkout is not configured yet." }, { status: 503 });
  // The production adapter must reload price and inventory by variant ID,
  // reserve stock transactionally, and create an idempotent provider session.
  return NextResponse.json({ message: "Payment adapter is ready to be connected." }, { status: 501 });
}
