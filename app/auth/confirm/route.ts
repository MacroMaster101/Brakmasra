import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth";
import { authDemoMode, authEnabled } from "@/lib/features";
import { createAuthClient } from "@/lib/supabase-auth";

const allowedOtpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(request: NextRequest) {
  if (!authEnabled) return NextResponse.redirect(new URL("/login", request.url));
  if (authDemoMode) return NextResponse.redirect(new URL("/account?demo=1", request.url));

  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
  const destination = request.nextUrl.clone();
  destination.pathname = next;
  destination.search = "";

  const supabase = await createAuthClient();
  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    error = result.error;
  } else if (tokenHash && rawType && allowedOtpTypes.has(rawType as EmailOtpType)) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: rawType as EmailOtpType,
    });
    error = result.error;
  } else {
    error = new Error("Missing confirmation token.");
  }

  if (!error) return NextResponse.redirect(destination);

  destination.pathname = "/login";
  destination.searchParams.set("notice", "confirmation-failed");
  return NextResponse.redirect(destination);
}
