-- RX Team — Етап 4 (реферали)
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap3.sql.

-- Прив'язка інвайтер → новачок. Реферал авто-підтверджується на першому чек-іні новачка.
create table if not exists referrals (
  id           bigint generated always as identity primary key,
  inviter_id   bigint references players(id) on delete cascade,
  invited_id   bigint references players(id) on delete cascade,
  game_id      bigint references games(id) on delete set null,  -- гра першого чек-іну новачка
  status       text not null default 'pending',                 -- pending|confirmed|rejected
  photo        text,                                            -- (не використовуємо — спрощено)
  created_at   timestamptz default now(),
  confirmed_at timestamptz,
  unique (invited_id)                                            -- один новачок = один інвайтер
);
create index if not exists idx_referrals_inviter on referrals (inviter_id);

insert into settings (key, value) values ('feature_referrals', 'true')
on conflict (key) do nothing;
