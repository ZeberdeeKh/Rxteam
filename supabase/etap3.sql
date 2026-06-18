-- RX Team — Етап 3 (економіка: бали, патч, ранги, ачівки)
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap2.sql / etap2b.sql.
-- Поля players.points_earned / points_balance / has_patch / rank уже є з etap2.sql.

-- Журнал балів (кожне нарахування/списання)
create table if not exists point_log (
  id         bigint generated always as identity primary key,
  player_id  bigint references players(id) on delete cascade,
  delta      int  not null,                       -- фактично (вже з множником 85% для заробітку)
  reason     text not null,                       -- attend|noshow|friend|achievement|rank_purchase|manual
  game_id    bigint references games(id) on delete set null,
  meta       text,                                -- код ачівки / рангу тощо
  created_at timestamptz default now()
);
create index if not exists idx_point_log_player on point_log (player_id);

-- Заявки на патч (членство). request → approved (адмін підтвердив) → handed (видано на грі)
create table if not exists patch_requests (
  id         bigint generated always as identity primary key,
  player_id  bigint references players(id) on delete cascade,
  status     text not null default 'requested',  -- requested|approved|handed|rejected
  created_at timestamptz default now(),
  decided_at timestamptz,
  decided_by bigint references players(id) on delete set null
);
create index if not exists idx_patch_requests_status on patch_requests (status);

-- Ачівки (конфіг) + здобуті гравцями
create table if not exists achievements (
  code     text primary key,                      -- first_contact, deploy_10, ...
  title_pl text, title_en text, title_uk text,
  tier     text not null default 'mid',           -- easy|mid|hard (визначає бали)
  enabled  boolean not null default true
);

create table if not exists player_achievements (
  id         bigint generated always as identity primary key,
  player_id  bigint references players(id) on delete cascade,
  code       text references achievements(code),
  game_id    bigint references games(id) on delete set null,
  created_at timestamptz default now(),
  unique (player_id, code)
);

-- Сід ачівок (мілітарі-назви; бали — за tier із settings)
insert into achievements (code, title_pl, title_en, title_uk, tier) values
  ('first_contact',   'First Contact',  'First Contact',  'First Contact',  'easy'),
  ('deploy_10',       '10 Deployments', '10 Deployments', '10 Deployments', 'mid'),
  ('deploy_25',       '25 Deployments', '25 Deployments', '25 Deployments', 'mid'),
  ('deploy_50',       '50 Deployments', '50 Deployments', '50 Deployments', 'hard'),
  ('recruiter',       'Recruiter',      'Recruiter',      'Recruiter',      'mid'),
  ('dawn_patrol',     'Dawn Patrol',    'Dawn Patrol',    'Dawn Patrol',    'easy'),
  ('iron_discipline', 'Iron Discipline','Iron Discipline','Iron Discipline','hard')
on conflict (code) do nothing;

-- Налаштування економіки (заглушки — майстер-адмін міняє на сайті)
insert into settings (key, value) values
  ('feature_economy',      'true'),
  ('feature_patch',        'true'),
  ('feature_achievements', 'true'),
  ('pts_attend',           '10'),    -- явка
  ('pts_noshow',           '-5'),    -- неявка (зі знаком)
  ('pts_friend',           '10'),    -- приведений друг
  ('pts_ach_easy',         '5'),
  ('pts_ach_mid',          '10'),
  ('pts_ach_hard',         '20'),
  ('no_patch_multiplier',  '0.85'),  -- без патча заробіток × 0.85
  ('patch_price_zl',       ''),      -- [заглушка] ціна патча в złoty (готівка) — заповнити
  ('rank_cost_scout',      '100'),
  ('rank_cost_squad',      '250'),   -- Squad Leader
  ('rank_cost_team',       '500')    -- Team Leader
on conflict (key) do nothing;
