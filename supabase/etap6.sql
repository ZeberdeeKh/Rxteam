-- RX Team — Етап 6.0 (фундамент сайту: ідентичності + лінк-коди)
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap5c.sql.

-- Ідентичності: один профіль player ↔ кілька способів входу (telegram | email).
--  - telegram: external_id = players.tg_user_id
--  - email:    external_id = Supabase auth.users.id (uuid)
create table if not exists identities (
  id          bigint generated always as identity primary key,
  player_id   bigint not null references players(id) on delete cascade,
  provider    text   not null,           -- 'telegram' | 'email'
  external_id text   not null,
  verified    boolean not null default false,
  created_at  timestamptz default now(),
  unique (provider, external_id)
);
create index if not exists idx_identities_player on identities (player_id);

-- Одноразові коди прив'язки сайт↔Telegram (видає бот командою /linksite).
create table if not exists link_codes (
  code        text primary key,          -- короткий код (6 символів)
  player_id   bigint not null references players(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz default now()
);
create index if not exists idx_link_codes_player on link_codes (player_id);

-- Перемикач функції лінкування (за замовчуванням увімкнено).
insert into settings (key, value) values ('feature_site_link', 'true')
on conflict (key) do nothing;
