-- Payment columns for the clients table
-- Run this in your Supabase SQL Editor after supabase-clients-migration.sql

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS plan             text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS payment_status   text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Optional: add an index for fast webhook lookups by subscription ID
CREATE INDEX IF NOT EXISTS clients_stripe_subscription_id_idx
  ON clients (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
