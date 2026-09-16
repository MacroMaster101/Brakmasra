import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthEnvironment } from "@/lib/auth";

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
