-- Portal de Aprovação de Conteúdo — ZAIA Studio
-- Schema: multi-tenant by client_id, one Supabase project for all clients.
--
-- Access model: there is no Supabase Auth / login. The Next.js server (using
-- the service_role key, kept server-side only) is the only caller of this
-- database. RLS is enabled with no policies, so the anon/public key — even if
-- ever leaked to the browser — cannot read or write anything. Client-link
-- security (access_token) and admin-route isolation are enforced in the app.

create extension if not exists "pgcrypto";

do $$ begin
  create type post_type as enum ('carrossel', 'video', 'estatico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_status as enum ('pendente', 'aprovado', 'ajustar');
exception when duplicate_object then null; end $$;

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

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  active boolean not null default true, -- soft delete: never hard-delete a client, just flip this
  created_at timestamptz not null default now()
);

-- 1:1 with clients. A client is only considered "fully onboarded" once this
-- exists with all three fields filled in — see section 4.1 of the briefing.
create table if not exists client_context (
  client_id uuid primary key references clients(id) on delete cascade,
  tone text not null default '',
  target_audience text not null default '',
  dont_do text not null default '',
  updated_at timestamptz not null default now()
);

-- 1:1 with clients. Long-term vision of the partnership, shown on Home —
-- distinct from months.strategy_objective ("Foco do mês"), which is tactical
-- and changes every month, shown at the top of the Feed instead.
create table if not exists project_objectives (
  client_id uuid primary key references clients(id) on delete cascade,
  text text not null default '',
  updated_at timestamptz not null default now()
);

-- Contracted scope as a list of categories (e.g. Reels, Feed, Edição de
-- vídeos) instead of a single post count — each has its own cadence and
-- optional monthly target, tracked per month via scope_progress.
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

-- Standalone deliverables (e.g. Media Kit) — schema only for now, per the
-- briefing's data structure section; no screen has been specified for it yet.
create table if not exists strategic_materials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  notes text not null default '',
  includes text[] not null default '{}',
  created_at timestamptz not null default now()
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

create table if not exists months (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  month_key text not null, -- e.g. '2026-07'
  strategy_objective text not null default '',
  strategy_pillars text[] not null default '{}',
  planning_stage planning_stage not null default 'aberto',
  created_at timestamptz not null default now(),
  unique (client_id, month_key)
);

-- Manual per-month tally of a scope category vs. its monthly_target. Not
-- derived from posts automatically: a scope category (e.g. "Reels") doesn't
-- map 1:1 to a Post.type (a Reel is a video, but not every video is a Reel),
-- so cross-referencing the two tables would silently produce a wrong number.
-- The team updates produced_count by hand in the Checklist de Produção.
create table if not exists scope_progress (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  scope_item_id uuid not null references scope_items(id) on delete cascade,
  produced_count int not null default 0,
  unique (month_id, scope_item_id)
);

-- Carousel copy approved before design work starts. Visible to both the
-- client and the team (unlike Etapa/Demandas, which are team-only) — see
-- briefing section 4.2 for why this is a top-level page instead of a tab
-- inside Etapa.
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

-- Same append-only pattern as post_comment_history.
create table if not exists script_comment_history (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references scripts(id) on delete cascade,
  status post_status not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists script_comment_history_script_id_idx on script_comment_history(script_id);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references months(id) on delete cascade,
  script_id uuid references scripts(id) on delete set null, -- which approved script (if any) this post was designed from
  position int not null default 0,
  type post_type not null default 'estatico',
  caption text not null default '',
  scheduled_date date,
  status post_status not null default 'pendente',
  comment text not null default '',
  media_link text, -- external fallback (Drive/Canva) for videos over the upload limit
  cover_path text, -- thumbnail image shown in the feed grid, mainly for type='video' (browsers don't reliably show a video's first frame as a static preview)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_month_id_idx on posts(month_id);
create index if not exists posts_status_idx on posts(status);

create table if not exists post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists post_media_post_id_idx on post_media(post_id);

-- Append-only: every status change (with its comment) becomes a new row
-- instead of overwriting posts.comment, so client feedback keeps a full trail.
create table if not exists post_comment_history (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  status post_status not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists post_comment_history_post_id_idx on post_comment_history(post_id);

alter table clients enable row level security;
alter table client_context enable row level security;
alter table project_objectives enable row level security;
alter table scope_items enable row level security;
alter table scope_progress enable row level security;
alter table strategic_materials enable row level security;
alter table demands enable row level security;
alter table months enable row level security;
alter table scripts enable row level security;
alter table script_comment_history enable row level security;
alter table posts enable row level security;
alter table post_media enable row level security;
alter table post_comment_history enable row level security;

-- Storage bucket for post media. Public read (preview links used directly in
-- <img>/<video> tags). Writes happen via a signed upload URL that the server
-- (service_role) generates per-file and hands to the browser, so large video
-- uploads go straight from the browser to Storage instead of through our
-- Vercel serverless function (which has its own request body size limit).
-- file_size_limit enforces the 200MB cap server-side too, in case client-side
-- validation is bypassed.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 209715200)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;
