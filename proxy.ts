import type { NextRequest } from "next/server";

import { refreshAuthSession } from "@/lib/supabase-auth-proxy";
import { authDemoMode, authEnabled } from "@/lib/features";

export async function proxy(request: NextRequest) {
  if (!authEnabled || authDemoMode) return;
  return refreshAuthSession(request);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/forgot-password",
    "/login",
    "/reset-password",
    "/signup",
  ],
};
