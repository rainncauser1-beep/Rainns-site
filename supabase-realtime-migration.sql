-- Enables Supabase Realtime broadcasts for call_logs so the client portal
-- can subscribe to INSERTs and update the dashboard live without refresh.
--
-- Safe to re-run: ALTER PUBLICATION ... ADD TABLE is idempotent-ish, but
-- if the table is already in the publication it errors. We catch that.

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_logs;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Already enabled, no-op
      NULL;
  END;
END
$$;
