-- Payment columns for the clients table (custom-pricing model)
-- Each client is quoted individually — setup_fee + monthly_recurring (existing) hold
-- the agreed amounts. Run this after supabase-clients-migration.sql.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS setup_fee              numeric,
  ADD COLUMN IF NOT EXISTS payment_status         text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Index for fast webhook lookups by subscription ID
CREATE INDEX IF NOT EXISTS clients_stripe_subscription_id_idx
  ON clients (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
