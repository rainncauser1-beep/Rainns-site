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
