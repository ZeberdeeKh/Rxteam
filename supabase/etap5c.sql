-- RX Team — Етап 5c (лотерея надійних + сезонне)
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap5b.sql.
-- Ачівка iron_discipline вже засіяна в etap3.sql.

-- Проведені сезонні лотереї (1 на квартал).
create table if not exists season_runs (
  id             bigint generated always as identity primary key,
  quarter        text unique,                       -- 'Q2 2026'
  winner_id      bigint references players(id) on delete set null,
  eligible_count int default 0,
  run_at         timestamptz default now()
);

insert into settings (key, value) values ('feature_lottery', 'true')
on conflict (key) do nothing;
