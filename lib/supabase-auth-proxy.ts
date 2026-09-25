import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthEnvironment } from "@/lib/auth";

/** True when the request carries a Supabase session cookie (possibly chunked, e.g. `sb-<ref>-auth-token.0`). */
export function hasSupabaseAuthCookie(request: Pick<NextRequest, "cookies">) {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export async function refreshAuthSession(request: NextRequest, requestHeaders = request.headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  let environment: ReturnType<typeof getAuthEnvironment>;
  try {
    environment = getAuthEnvironment();
  } catch {
    return response;
  }

  const supabase = createServerClient(environment.url, environment.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Server components in this same request (the layout reads the member)
        // must see the refreshed tokens, not the ones the browser sent.
        requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
