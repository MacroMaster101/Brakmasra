import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthEnvironment } from "@/lib/auth";

export async function createAuthClient() {
  const cookieStore = await cookies();
  const { publishableKey, url } = getAuthEnvironment();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes
          // the session before rendering and applies any cookie changes.
        }
      },
    },
  });
}
