-- RX Team — Етап 0/1 (шилд + перемикачі функцій)
-- Виконати в Supabase → SQL Editor.

-- Налаштування / feature flags (ключ-значення)
create table if not exists settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

insert into settings (key, value) values
  ('feature_shield', 'true'),
  ('feature_onboarding_faq', 'true')
on conflict (key) do nothing;

-- Капчі для заявок на вступ
create table if not exists join_challenges (
  id           bigint generated always as identity primary key,
  chat_id      bigint not null,
  user_id      bigint not null,
  user_chat_id bigint not null,
  answer       int    not null,
  lang         text   not null default 'en',
  status       text   not null default 'pending', -- pending | passed | failed | expired
  created_at   timestamptz default now(),
  expires_at   timestamptz not null,
  unique (chat_id, user_id)
);

create index if not exists idx_join_challenges_status on join_challenges (status);
