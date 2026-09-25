import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { getSupabaseServerClient } from "@/lib/supabase";

// Daily job scheduled in vercel.json. Clears expired rate-limit rows, and the
// query itself counts as database activity, which stops a free-plan Supabase
// project from being paused after a quiet week.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ message: "Database is not configured." }, { status: 503 });

  const { error } = await supabase.rpc("prune_rate_limits");
  if (error) return NextResponse.json({ message: "Maintenance failed." }, { status: 503 });

  return NextResponse.json({ message: "Maintenance complete." });
}
