-- RX Team — Етап 5b (голосування за локацію)
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap5.sql.

-- Опитування за локацію (нативний Telegram-poll; голоси рахує Telegram).
create table if not exists polls (
  id           bigint generated always as identity primary key,
  tg_poll_id   text,
  chat_id      bigint,
  message_id   bigint,
  thread_id    bigint,
  location_ids bigint[],                          -- порядок = порядок опцій у Telegram
  status       text not null default 'open',      -- open|closed
  created_at   timestamptz default now(),
  closed_at    timestamptz
);
create index if not exists idx_polls_status on polls (status);

insert into settings (key, value) values ('feature_voting', 'true')
on conflict (key) do nothing;
