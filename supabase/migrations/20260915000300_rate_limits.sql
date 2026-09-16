-- Durable, shared rate limiting.
--
-- The in-memory limiter in lib/rate-limit.ts only bounds a single server
-- instance, so on a multi-instance deployment (Vercel, autoscaling) each
-- instance enforced its own separate allowance. This table moves the counter
-- into PostgreSQL so every instance shares one budget.
--
-- It also backs the YouTube upstream call budget, keyed per UTC day.

CREATE TABLE IF NOT EXISTS rate_limits (
  key        TEXT PRIMARY KEY,
  count      INTEGER     NOT NULL DEFAULT 0,
  reset_at   TIMESTAMPTZ NOT NULL
);

-- Supports pruning expired rows.
CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits (reset_at);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON rate_limits FROM anon, authenticated;
GRANT ALL ON rate_limits TO service_role;

-- Atomic check-and-increment. A single statement so concurrent requests across
-- instances cannot race past the limit.
-- Returns the remaining allowance, or -1 when the caller is over the limit.
CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key       TEXT,
  p_limit     INTEGER,
  p_window_ms BIGINT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now    TIMESTAMPTZ := now();
  v_window INTERVAL     := make_interval(secs => p_window_ms / 1000.0);
  v_count  INTEGER;
BEGIN
  INSERT INTO rate_limits AS rl (key, count, reset_at)
  VALUES (p_key, 1, v_now + v_window)
  ON CONFLICT (key) DO UPDATE
    SET count    = CASE WHEN rl.reset_at <= v_now THEN 1 ELSE rl.count + 1 END,
        reset_at = CASE WHEN rl.reset_at <= v_now THEN v_now + v_window ELSE rl.reset_at END
  RETURNING count INTO v_count;

  IF v_count > p_limit THEN
    RETURN -1;
  END IF;

  RETURN p_limit - v_count;
END;
$$;

REVOKE ALL ON FUNCTION consume_rate_limit(TEXT, INTEGER, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INTEGER, BIGINT) TO service_role;

-- Housekeeping: drop rows whose window has long expired. Safe to run on a cron.
CREATE OR REPLACE FUNCTION prune_rate_limits() RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rate_limits WHERE reset_at < now() - INTERVAL '1 day';
$$;

REVOKE ALL ON FUNCTION prune_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION prune_rate_limits() TO service_role;
