import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBody, requestKey, sameOrigin } from "@/lib/request";
import { getSupabaseServerClient } from "@/lib/supabase";
import { contactSchema } from "@/lib/contact";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 8192) return NextResponse.json({ message: "Request too large." }, { status: 413 });
  if (!(await rateLimit(requestKey(request, "contact"), 3, 15 * 60_000)).allowed) return NextResponse.json({ message: "Too many attempts. Please try later." }, { status: 429 });
  const parsed = contactSchema.safeParse(await readJsonBody(request, 8192));
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
