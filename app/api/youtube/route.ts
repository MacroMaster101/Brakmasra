import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { requestKey } from "@/lib/request";
import { getYouTubeData } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  if (!(await rateLimit(requestKey(request, "youtube"), 30, 60_000)).allowed) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429, headers: { "Retry-After": "60" } });
  }
  const data = await getYouTubeData();
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
