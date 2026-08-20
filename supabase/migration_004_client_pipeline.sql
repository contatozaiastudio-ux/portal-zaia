-- ZAIA FLOW — pipeline de etapa por cliente + links de acesso rápido
-- Rode isso inteiro de uma vez no SQL Editor do Supabase.

create table if not exists client_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color_bg text not null,
  color_text text not null,
  position int not null unique
);

insert into client_stages (name, color_bg, color_text, position) values
  ('Planejamento', '#EEF1F3', '#3E4A50', 1),
  ('Revisão',      '#D7DEE1', '#3E4A50', 2),
  ('Aprovação',    '#C0CBD0', '#2B353A', 3),
  ('Design',       '#A9B7BE', '#20282C', 4),
  ('Ajustes',      '#899AA2', '#FFFFFF', 5),
  ('Programação',  '#6D7D85', '#FFFFFF', 6),
  ('Meta batida',  '#341614', '#EEE7B9', 7)
on conflict (position) do nothing;

alter table clients
  add column if not exists client_stage_id uuid references client_stages(id),
  add column if not exists client_stage_updated_at timestamptz not null default now();

-- clientes existentes começam na primeira etapa ("Planejamento")
update clients
set client_stage_id = (select id from client_stages where position = 1)
where client_stage_id is null;

alter table clients
  alter column client_stage_id set not null;

create table if not exists client_links (
  client_id uuid primary key references clients(id) on delete cascade,
  notion_url text,
  drive_url text,
  canva_feed_url text,
  canva_stories_url text
);
