-- Migration for the existing production Supabase project — adds everything
-- needed for the Painel ZAIA Studio (team login, agency dashboard, client
-- context, contracted scope, planning stage, demands) on top of the tables
-- already created by schema.sql. Safe to run once; uses IF NOT EXISTS /
-- DO blocks throughout so re-running it is harmless.

do $$ begin
  create type team_member as enum ('ju', 'carol', 'analista');
exception when duplicate_object then null; end $$;

do $$ begin
  create type planning_stage as enum ('aberto', 'escrita', 'design', 'aprovacao');
exception when duplicate_object then null; end $$;

do $$ begin
  create type demand_origin as enum ('whatsapp', 'ligacao', 'reuniao', 'email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type demand_status as enum ('aberta', 'andamento', 'concluida');
exception when duplicate_object then null; end $$;

alter table clients add column if not exists responsible team_member not null default 'ju';
alter table clients add column if not exists contracted_posts_per_month int not null default 8;
alter table clients add column if not exists contract_notes text not null default '';
alter table clients add column if not exists active boolean not null default true;

create table if not exists client_context (
  client_id uuid primary key references clients(id) on delete cascade,
  tone text not null default '',
  target_audience text not null default '',
  dont_do text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists demands (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  description text not null,
  origin demand_origin not null,
  responsible team_member not null,
  status demand_status not null default 'aberta',
  created_at timestamptz not null default now()
);

create index if not exists demands_client_id_idx on demands(client_id);
create index if not exists demands_status_idx on demands(status);

alter table months add column if not exists planning_stage planning_stage not null default 'aberto';

alter table client_context enable row level security;
alter table demands enable row level security;
