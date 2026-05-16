-- Stores every inbound call Retell handles for any client.
-- Powers admin call history, client portal call list, and the lead-handoff
-- email function.

CREATE TABLE IF NOT EXISTS call_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid REFERENCES clients(id) ON DELETE CASCADE,
  agent_id          text,
  call_id           text UNIQUE,
  from_number       text,
  to_number         text,
  duration_seconds  integer,
  transcript        text,
  summary           text,
  sentiment         text,
  started_at        timestamptz,
  raw               jsonb,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_logs_client_id_idx  ON call_logs (client_id);
CREATE INDEX IF NOT EXISTS call_logs_started_at_idx ON call_logs (started_at DESC);
CREATE INDEX IF NOT EXISTS call_logs_agent_id_idx   ON call_logs (agent_id);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Admin reads everything (matches the existing clients-table pattern)
CREATE POLICY "Authenticated users can read call_logs"
  ON call_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Writes only happen from the lead-handoff Netlify function via the
-- service-role key (which bypasses RLS), so no client INSERT/UPDATE policy
-- needs to exist.
