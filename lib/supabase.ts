import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null | undefined;

export function hasSupabaseConfig() {
  return Boolean(
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

/**
 * Server-only privileged client. Never import this module into a client
 * component and never expose its key through a NEXT_PUBLIC_ variable.
 */
export function getSupabaseServerClient() {
  if (serverClient !== undefined) return serverClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    serverClient = null;
    return serverClient;
  }

  serverClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { "x-application-name": "brakmasra-web" } },
  });

  return serverClient;
}
