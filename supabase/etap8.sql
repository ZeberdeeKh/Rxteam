-- RX Team — Етап 8 (облік членства в групі для анти-абузу рефералів)
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap7.sql.
--
-- ВАЖЛИВО: Telegram Bot API НЕ дає перелічити всіх наявних учасників групи.
-- Тому таблиця наповнюється «наперед»: коли користувач щось пише в групі,
-- проходить капчу або коли приходить апдейт chat_member (вступ/вихід).
-- left_at != null → людина колись виходила з групи (для блокування реф-бонусу).

create table if not exists group_members (
  tg_user_id bigint primary key,
  status     text not null default 'member',  -- member | left
  first_seen timestamptz default now(),
  last_seen  timestamptz default now(),
  left_at    timestamptz                       -- остання дата виходу (якщо був)
);
create index if not exists idx_group_members_status on group_members (status);
