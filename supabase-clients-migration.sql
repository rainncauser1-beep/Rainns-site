-- Raindrop AI · Clients table migration
-- Run this in Supabase SQL Editor after the initial schema

create table clients (
  id uuid default gen_random_uuid() primary key,

  -- Business info
  business_name text not null,
  owner_name text,
  owner_email text,
  owner_phone text,
  business_phone text,
  industry text,
  website text,

  -- Agent setup config
  business_hours text,
  services text,
  top_objections text,
  brand_voice_notes text,
  crm text,

  -- Technical wiring
  retell_agent_id text,
  retell_phone_number text,
  zapier_webhook_url text,

  -- Status pipeline
  status text default 'lead' check (status in ('lead','booked','onboarding','live','paused')),

  -- 8-step go-live checklist
  step_intake_done boolean default false,
  step_agent_built boolean default false,
  step_tested boolean default false,
  step_number_forwarded boolean default false,
  step_sms_zap_live boolean default false,
  step_calendar_synced boolean default false,
  step_client_trained boolean default false,
  step_marked_live boolean default false,

  -- Meta
  notes text,
  monthly_recurring numeric(10, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast status filtering
create index clients_status_idx on clients(status);
create index clients_created_at_idx on clients(created_at desc);

-- RLS: only authenticated users (admin) can read/write
alter table clients enable row level security;

create policy "Admin can read clients" on clients
  for select using (auth.role() = 'authenticated');
create policy "Admin can insert clients" on clients
  for insert with check (auth.role() = 'authenticated');
create policy "Admin can update clients" on clients
  for update using (auth.role() = 'authenticated');
create policy "Admin can delete clients" on clients
  for delete using (auth.role() = 'authenticated');

-- Auto-update updated_at on every change
create or replace function update_clients_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_updated_at_trigger
  before update on clients
  for each row execute function update_clients_updated_at();
