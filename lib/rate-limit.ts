import { getSupabaseServerClient } from "@/lib/supabase";

type Result = { allowed: boolean; remaining: number };
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Process-local fallback. Bounds a single instance only — used when Supabase is
 * not configured, or when the shared counter is unreachable.
 */
function memoryLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0 };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

/**
 * Shared rate limit.
 *
 * Counts in PostgreSQL (see db/migrations/0003_rate_limits.sql) so every server
 * instance enforces one budget rather than one each. Falls back to the
 * in-memory counter when Supabase is unconfigured or unavailable — degraded,
 * but never fails open entirely and never blocks a request on a DB outage.
 */
export async function rateLimit(key: string, limit = 5, windowMs = 60_000): Promise<Result> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return memoryLimit(key, limit, windowMs);

  try {
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    });
    if (error || typeof data !== "number") return memoryLimit(key, limit, windowMs);
    return data < 0 ? { allowed: false, remaining: 0 } : { allowed: true, remaining: data };
  } catch {
    return memoryLimit(key, limit, windowMs);
  }
}
