import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseAuthCookie, refreshAuthSession } from "@/lib/supabase-auth-proxy";
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

// Pages that only make sense signed in.
const memberPaths = ["/account", "/admin"];

function matches(paths: string[], pathname: string) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthPath(pathname: string) {
  return matches(authPaths, pathname);
}

// The header shows the member on every page, so a signed-in visitor's session
// is refreshed everywhere. Anonymous visitors carry no Supabase auth cookie and
// never cause a Supabase call outside the auth pages.
function shouldRefreshSession(request: NextRequest) {
  return isAuthPath(request.nextUrl.pathname) || hasSupabaseAuthCookie(request);
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  // Without any session cookie the visitor is certainly signed out: send them to
  // sign in straight away instead of rendering the page first. The pages still
  // verify the session themselves.
  const { pathname } = request.nextUrl;
  if (authEnabled && !authDemoMode && matches(memberPaths, pathname) && !hasSupabaseAuthCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(login);
    redirect.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return redirect;
  }

  const response = authEnabled && !authDemoMode && shouldRefreshSession(request)
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
