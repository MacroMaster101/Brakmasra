import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { requestKey, sameOrigin } from "@/lib/request";

const schema = z.object({ email: z.email().max(254), consent: z.literal("true"), company: z.string().max(0).optional() });

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 4096) return NextResponse.json({ message: "Request too large." }, { status: 413 });
  if (!rateLimit(requestKey(request, "newsletter"), 3, 10 * 60_000).allowed) return NextResponse.json({ message: "Too many attempts. Please try later." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid email and confirm consent." }, { status: 400 });
  if (!process.env.DATABASE_URL || !process.env.EMAIL_PROVIDER_API_KEY) return NextResponse.json({ message: "Newsletter signup is not configured yet." }, { status: 503 });
  return NextResponse.json({ message: "Newsletter storage adapter is ready to be connected." }, { status: 501 });
}
