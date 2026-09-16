import { NextResponse, type NextRequest } from "next/server";

import { refreshAuthSession } from "@/lib/supabase-auth-proxy";
import { authDemoMode, authEnabled } from "@/lib/features";
import { createContentSecurityPolicy } from "@/lib/security-headers";

const authPaths = [
  "/account",
  "/admin",
  "/auth",
  "/forgot-password",
  "/login",
  "/reset-password",
  "/signup",
];

function isAuthPath(pathname: string) {
  return authPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = authEnabled && !authDemoMode && isAuthPath(request.nextUrl.pathname)
    ? await refreshAuthSession(request, requestHeaders)
    : NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
