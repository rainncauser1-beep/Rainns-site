-- Adds a canonical trade/vertical to each client so the account system is
-- trade-aware (roofing, hvac, plumbing, lawncare, …). Values match the slugs
-- in src/config/verticals.js. The existing free-text `industry` column stays
-- as the optional human specialty (e.g. "Residential roofing").
--
-- Safe to run multiple times. Run this in the Supabase SQL editor BEFORE
-- deploying the trade-aware onboarding (otherwise the insert of `vertical`
-- would be rejected as an unknown column).

alter table public.clients
  add column if not exists vertical text;

-- Backfill: every existing client today is a roofer (single-vertical history).
update public.clients
  set vertical = 'roofing'
  where vertical is null;

-- Helps admin filtering by trade.
create index if not exists clients_vertical_idx on public.clients (vertical);
