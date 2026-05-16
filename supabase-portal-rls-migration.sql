-- Lets clients log into the /portal at raindrop and see ONLY their own data.
-- These policies ADD to whatever existing admin policies are on the tables —
-- RLS combines with OR, so admin (rainn.causer1@gmail.com) still has full
-- access via the existing "authenticated users can…" policies.

-- A client can read their own row in clients (matched by owner_email)
CREATE POLICY "Clients can read own row"
  ON clients FOR SELECT
  USING (auth.jwt() ->> 'email' = owner_email);

-- A client can read their own call_logs (joined through clients by email)
CREATE POLICY "Clients can read own call_logs"
  ON call_logs FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_email = (auth.jwt() ->> 'email')
    )
  );
