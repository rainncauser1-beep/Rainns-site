-- Stores the public "Try the AI" demo agent for each trade (one Retell web-call
-- agent per vertical + a generic 'default'). Populated by the admin
-- provision-demo-agents function; read by create-call.js to route a demo call
-- to the right trade's agent. Web-call agents need no phone number.
--
-- Safe to run multiple times.

create table if not exists public.demo_agents (
  vertical text primary key,
  agent_id text not null,
  llm_id text,
  updated_at timestamptz default now()
);

-- Lock it down. Only the service-role key (the server functions create-call.js
-- and provision-demo-agents.js) ever touches this table, and the service role
-- bypasses RLS. With RLS enabled and NO policies, anon/authenticated keys get
-- zero access — which is exactly what we want, and it silences the SQL-editor
-- "no RLS" warning.
alter table public.demo_agents enable row level security;
