-- RX Team — Етап 2 (ядро: гравці, локації, ігри, реєстрації, чек-іни)
-- Виконати в Supabase → SQL Editor ПІСЛЯ schema.sql.

-- Гравці (один профіль = одна людина)
create table if not exists players (
  id            bigint generated always as identity primary key,
  tg_user_id    bigint unique,
  name          text,
  tg_username   text,
  callsign      text unique,              -- позивний, вписується при першій реєстрації
  lang          text default 'uk',        -- обрана мова інтерфейсу
  games_played  int  not null default 0,  -- реєстрація + чек-ін
  points_earned int  not null default 0,  -- «зароблено всього» (рейтинг, тільки вгору)
  points_balance int not null default 0,  -- доступний баланс (витрачається на звання/бонуси)
  has_patch     boolean not null default false,
  rank          text,
  is_admin      boolean not null default false,
  is_master     boolean not null default false,
  admin_perms   text[] default '{}',      -- games|rental|checkin|referrals|players|joins
  created_at    timestamptz default now()
);

-- Полігони (різні локації ігор)
create table if not exists locations (
  id         bigint generated always as identity primary key,
  name       text not null,
  lat        double precision not null,
  lng        double precision not null,
  radius_m   int  not null default 300,
  map_url    text,
  created_at timestamptz default now()
);

-- Ігри
create table if not exists games (
  id                  bigint generated always as identity primary key,
  location_id         bigint references locations(id),
  title               text,
  start_at            timestamptz not null,
  reg_closes_at       timestamptz,            -- старт − 9 год
  cancel_deadline     timestamptz,            -- старт − 24 год
  checkin_from        timestamptz,            -- старт − 1 год
  checkin_to          timestamptz,            -- старт + 1 год
  capacity            int,                    -- null = без ліміту
  status              text not null default 'announced', -- announced|finished|cancelled
  announce_chat_id    bigint,
  announce_thread_id  bigint,
  announce_message_id bigint,
  created_at          timestamptz default now()
);

-- Реєстрації
create table if not exists registrations (
  id           bigint generated always as identity primary key,
  game_id      bigint references games(id) on delete cascade,
  player_id    bigint references players(id) on delete cascade,
  status       text not null default 'registered', -- registered|cancelled|no_show
  needs_rental boolean default false,
  transport    text,                                -- own|need
  from_place   text,
  free_seats   int,
  seats_closed boolean default false,
  created_at   timestamptz default now(),
  unique (game_id, player_id)
);

-- Чек-іни (реєстрація + чек-ін = +1 гра)
create table if not exists checkins (
  id         bigint generated always as identity primary key,
  game_id    bigint references games(id) on delete cascade,
  player_id  bigint references players(id) on delete cascade,
  lat        double precision,
  lng        double precision,
  distance_m int,
  source     text default 'tg',   -- tg|web
  is_manual  boolean default false,
  created_at timestamptz default now(),
  unique (game_id, player_id)
);

-- Простий стан діалогів (для покрокових форм у боті)
create table if not exists user_states (
  tg_user_id bigint primary key,
  state      text,
  data       jsonb default '{}',
  updated_at timestamptz default now()
);

-- Майстер-адмін за username (бутстрап)
insert into settings (key, value) values ('master_username', 'delltex')
on conflict (key) do nothing;
