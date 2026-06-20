-- Per-IP daily backstop for the public "Try the AI" demo. The per-email cap
-- (demo_trials, 5 calls) is the primary limit; this catches abuse where someone
-- cycles random emails from one machine. create-call.js increments this and
-- 429s past the daily cap; it degrades gracefully (skips IP limiting) if this
-- table doesn't exist yet, so deploying the code first is safe.
--
-- Safe to run multiple times.

create table if not exists public.demo_ip_usage (
  ip text not null,
  day date not null,
  count integer not null default 0,
  updated_at timestamptz default now(),
  primary key (ip, day)
);

-- Service-role only (create-call.js). No anon/authenticated access.
alter table public.demo_ip_usage enable row level security;
