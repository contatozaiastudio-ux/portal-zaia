-- Sample data for the pilot client (SBC), July 2026.
-- Run after schema.sql. Replace media rows with real uploads via the admin
-- panel — these seed rows exist only so the feed isn't empty on first load.

insert into clients (name, slug)
values ('SBC', 'sbc')
on conflict (slug) do nothing;

with c as (select id from clients where slug = 'sbc')
insert into months (client_id, month_key, strategy_objective, strategy_pillars)
select c.id, '2026-07', 'Aumentar reconhecimento de marca e engajamento no feed', array['Autoridade', 'Proximidade', 'Conversão']
from c
on conflict (client_id, month_key) do nothing;

with m as (
  select months.id from months
  join clients on clients.id = months.client_id
  where clients.slug = 'sbc' and months.month_key = '2026-07'
)
insert into posts (month_id, position, type, caption, scheduled_date, status)
select m.id, v.position, v.type::post_type, v.caption, v.scheduled_date::date, 'pendente'::post_status
from m, (values
  (1, 'carrossel', 'Abertura do mês — bastidores da equipe.', '2026-07-02'),
  (2, 'estatico', 'Depoimento de cliente satisfeito.', '2026-07-05'),
  (3, 'video', 'Reels mostrando o processo de produção.', '2026-07-09'),
  (4, 'carrossel', 'Antes e depois de um projeto recente.', '2026-07-14'),
  (5, 'estatico', 'Frase de autoridade sobre o mercado.', '2026-07-18'),
  (6, 'video', 'Bastidor rápido de um evento.', '2026-07-23')
) as v(position, type, caption, scheduled_date)
where not exists (select 1 from posts where posts.month_id = m.id and posts.position = v.position);
