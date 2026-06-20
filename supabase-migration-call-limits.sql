-- Migration: add call limit tracking to clients table
-- Run this in your Supabase SQL editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS monthly_call_limit integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calls_this_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calls_reset_at timestamptz;

-- Index for fast lookups by agent_id (already exists, but ensure it's there)
CREATE INDEX IF NOT EXISTS clients_retell_agent_id_idx ON clients (retell_agent_id);

-- Row-level security: clients can read their own data but NOT update call counters
-- (call counters are only updated by the service role via Netlify functions)
-- If RLS is enabled, add a policy for the anon key to read call limit fields:
-- (adjust to match your existing RLS setup)

-- Example read policy (if you use RLS with owner_email = auth.email()):
-- CREATE POLICY "clients can view their own call usage"
--   ON clients FOR SELECT
--   USING (owner_email = auth.email());

-- Verify:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('monthly_call_limit', 'calls_this_month', 'calls_reset_at');
