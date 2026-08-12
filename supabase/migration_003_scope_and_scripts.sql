-- Migration for the existing production Supabase project — briefing seção
-- 0.1: Escopo Contratado becomes a list of categories, Objetivo do Projeto
-- (long-term) is split from Foco do mês (monthly/tactical), and Roteiros
-- (script approval) is added. Safe to run once; uses IF NOT EXISTS / DO
-- blocks throughout so re-running it is harmless.

create table if not exists project_objectives (
  client_id uuid primary key references clients(id) on delete cascade,
  text text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists scope_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  cadence text not null default '',
  content_types text[] not null default '{}',
  notes text not null default '',
  monthly_target int,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists scope_items_client_id_idx on scope_items(client_id);

create table if not exists strategic_materials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  notes text not null default '',
  includes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists scope_progress (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  scope_item_id uuid not null references scope_items(id) on delete cascade,
  produced_count int not null default 0,
  unique (month_id, scope_item_id)
);

create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  position int not null default 0,
  title text not null default '',
  content text not null default '',
  status post_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scripts_month_id_idx on scripts(month_id);

create table if not exists script_comment_history (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references scripts(id) on delete cascade,
  status post_status not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists script_comment_history_script_id_idx on script_comment_history(script_id);

alter table posts add column if not exists script_id uuid references scripts(id) on delete set null;

-- Carry forward the old single-number scope model as a "Geral" category
-- before dropping it, so nothing already filled in is silently lost.
insert into scope_items (client_id, title, notes, monthly_target)
select id, 'Geral', contract_notes, contracted_posts_per_month
from clients
where not exists (
  select 1 from scope_items where scope_items.client_id = clients.id and scope_items.title = 'Geral'
);

alter table clients drop column if exists responsible;
alter table clients drop column if exists contracted_posts_per_month;
alter table clients drop column if exists contract_notes;

alter table project_objectives enable row level security;
alter table scope_items enable row level security;
alter table scope_progress enable row level security;
alter table strategic_materials enable row level security;
alter table scripts enable row level security;
alter table script_comment_history enable row level security;
