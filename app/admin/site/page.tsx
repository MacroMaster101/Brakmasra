import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomSite, type SiteCheck } from "@/components/control-room/site";
import { controlRoomConfigured, recentAuditLogs } from "@/lib/control-room";
import { authDemoMode, authEnabled, commerceEnabled, launchMode } from "@/lib/features";

export const metadata: Metadata = { title: "Site", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomSitePage() {
  await requireControlRoom("manage_site", "/admin/site");

  // Booleans only: no environment value ever leaves the server.
  const checks: SiteCheck[] = [
    { label: "crCheckSupabaseUrl", value: Boolean(process.env.SUPABASE_URL), kind: "configured" },
    { label: "crCheckPublishableKey", value: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY), kind: "configured" },
    {
      label: "crCheckSecretKey",
      value: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      kind: "configured",
    },
    { label: "crCheckServiceClient", value: controlRoomConfigured(), kind: "configured" },
    { label: "crCheckCron", value: Boolean(process.env.CRON_SECRET), kind: "configured" },
    { label: "crCheckAuth", value: authEnabled, kind: "switch" },
    { label: "crCheckLaunchMode", value: launchMode, kind: "switch" },
    { label: "crCheckCommerce", value: commerceEnabled, kind: "switch" },
    { label: "crCheckDemo", value: authDemoMode, kind: "switch" },
  ];
  const audit = await loadSection(recentAuditLogs);

  return <ControlRoomSite checks={checks} audit={audit} />;
}
