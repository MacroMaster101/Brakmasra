import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { requestKey, sameOrigin } from "@/lib/request";
import { getSupabaseServerClient } from "@/lib/supabase";

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.email().max(254), topic: z.enum(["General inquiry", "Business inquiry", "Merch support", "Sponsorship"]), message: z.string().trim().min(10).max(2000), consent: z.literal("true"), website: z.string().max(0).optional() });

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 8192) return NextResponse.json({ message: "Request too large." }, { status: 413 });
  if (!rateLimit(requestKey(request, "contact"), 3, 15 * 60_000).allowed) return NextResponse.json({ message: "Too many attempts. Please try later." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Review the highlighted information and try again." }, { status: 400 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ message: "Contact delivery is not configured yet." }, { status: 503 });

  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    topic: parsed.data.topic,
    message: parsed.data.message,
  });

  if (error) return NextResponse.json({ message: "Your message could not be saved. Please try again later." }, { status: 503 });
  return NextResponse.json({ message: "Your message has been received." }, { status: 201 });
}
