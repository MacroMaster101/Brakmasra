-- Keep durable rate-limit storage bounded without relying on an external cron.
-- Cleanup runs opportunistically on roughly one percent of requests.

CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key       TEXT,
  p_limit     INTEGER,
  p_window_ms BIGINT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now    TIMESTAMPTZ := pg_catalog.now();
  v_window INTERVAL     := pg_catalog.make_interval(secs => p_window_ms / 1000.0);
  v_count  INTEGER;
BEGIN
  IF p_limit < 1 OR p_window_ms < 1000 THEN
    RAISE EXCEPTION 'Invalid rate-limit configuration';
  END IF;

  IF pg_catalog.random() < 0.01 THEN
    DELETE FROM public.rate_limits
    WHERE reset_at < v_now - INTERVAL '1 day';
  END IF;

  INSERT INTO public.rate_limits AS rl (key, count, reset_at)
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

CREATE OR REPLACE FUNCTION prune_rate_limits() RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.rate_limits
  WHERE reset_at < pg_catalog.now() - INTERVAL '1 day';
$$;

REVOKE ALL ON FUNCTION consume_rate_limit(TEXT, INTEGER, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INTEGER, BIGINT) TO service_role;
REVOKE ALL ON FUNCTION prune_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION prune_rate_limits() TO service_role;
