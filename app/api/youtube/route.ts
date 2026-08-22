import { NextResponse } from "next/server";
import { getYouTubeData } from "@/lib/youtube";
export async function GET() { const data = await getYouTubeData(); return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }); }
