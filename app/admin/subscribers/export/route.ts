import { NextResponse } from "next/server";

import { audit, controlRoomLimit, viewerWith } from "@/app/admin/action-helpers";
import { authDemoMode } from "@/lib/features";
import { csvCell } from "@/lib/store-admin-validation";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
const MAX_ROWS = 20_000;

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

/** Downloads every subscriber as CSV for Owner and Web Dev. Everyone else gets a plain 404. */
export async function GET() {
  const viewer = await viewerWith("manage_newsletter");
  if (!viewer || authDemoMode) return notFound();

  const attempt = await controlRoomLimit("subscriber-export", 10, 60 * 60_000, viewer.id);
  if (!attempt.allowed) return new NextResponse("Too many exports. Try again later.", { status: 429 });

  const supabase = getSupabaseServerClient();
  if (!supabase) return new NextResponse("Control Room data is not connected yet.", { status: 503 });

  const rows: string[] = ["email,status,consented_at,source"];
  try {
    for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("email, status, consented_at, source")
        .order("consented_at", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error || !data) return new NextResponse("The export could not be created. Please try again.", { status: 500 });
      for (const row of data) {
        rows.push([row.email, row.status, row.consented_at, row.source].map((value) => csvCell(String(value ?? ""))).join(","));
      }
      if (data.length < PAGE_SIZE) break;
    }
  } catch {
    return new NextResponse("The export could not be created. Please try again.", { status: 500 });
  }

  await audit(viewer, "subscriber.export", "newsletter_subscriber", "all", { rows: rows.length - 1 });
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${rows.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="brakmasra-subscribers-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
