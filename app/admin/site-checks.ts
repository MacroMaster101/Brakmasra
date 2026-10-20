import "server-only";

import type { SiteCheck } from "@/components/control-room/site";
import { controlRoomConfigured } from "@/lib/control-room";
import { authDemoMode, authEnabled, commerceEnabled, launchMode } from "@/lib/features";

/** Setup facts for the Site page and the overview. Booleans only: no environment value ever leaves the server. */
export function siteChecks(): SiteCheck[] {
  return [
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
}
