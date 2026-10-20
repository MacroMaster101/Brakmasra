import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { siteChecks } from "@/app/admin/site-checks";
import { ControlRoomSite } from "@/components/control-room/site";
import { recentAuditLogs } from "@/lib/control-room";

export const metadata: Metadata = { title: "Site", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomSitePage() {
  await requireControlRoom("manage_site", "/admin/site");
  const audit = await loadSection(() => recentAuditLogs());

  return <ControlRoomSite checks={siteChecks()} audit={audit} />;
}
