-- RX Team — Етап 11 (модерація топіка «Анонси ігор»: туди пише лише бот).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap10.sql.

-- Лічильник порушень у топіку анонсів (per користувач).
-- 1-ше порушення → попередження в приват; 2-ге і кожне наступне →
-- мут у групі на 1 год (заборона писати скрізь) + пояснення в приват.
create table if not exists announce_violations (
  tg_user_id bigint primary key,
  count      int not null default 0,
  last_at    timestamptz default now()
);

-- Перемикач модерації топіка анонсів (за замовчуванням увімкнено).
insert into settings (key, value) values ('feature_announce_guard', 'true')
on conflict (key) do nothing;
