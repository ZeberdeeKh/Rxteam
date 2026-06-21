-- RX Team — Етап 32.
-- 1) Бали за фото-пост у топіку «Zdjęcia i filmy z gier / Фото та відео з ігор»
--    (1 бал/пост; альбом = 1 пост; тижневий ліміт). Дедуп — таблиця photo_post_awards.
-- 2) Зміна позивного в магазині за бали (ціна — settings.callsign_change_cost).
-- Виконати в Supabase → SQL Editor. Ідемпотентно: можна виконувати повторно.

-- ── Дедуп нарахувань за фото-пост ──
-- Один пост = один рядок. UNIQUE(tg_chat_id, dedupe_key) робить вставку ідемпотентною:
-- кадри альбому (той самий media_group_id) і ретраї вебхука просто no-op.
-- dedupe_key = 'mg:<media_group_id>' для альбому, інакше 'msg:<message_id>' для одиночного фото.
create table if not exists photo_post_awards (
  id             bigint generated always as identity primary key,
  player_id      bigint not null references players(id) on delete cascade,
  tg_chat_id     bigint not null,
  dedupe_key     text   not null,
  message_id     bigint,            -- перше повідомлення поста (довідково)
  media_group_id text,              -- null для одиночного фото
  awarded_points int    not null default 0,  -- фактично нараховано (0 = ліміт/економіка off)
  created_at     timestamptz not null default now()
);
create unique index if not exists uq_photo_post_dedupe
  on photo_post_awards (tg_chat_id, dedupe_key);
-- Швидкий підрахунок тижневого ліміту на гравця (sum awarded_points за 7 днів).
create index if not exists idx_photo_post_player_created
  on photo_post_awards (player_id, created_at);

-- ── Нові ключі налаштувань ──
-- feature_photo_award — гейт нарахувань (за замовч. true через featureEnabled);
-- pts_photo_post — бали за пост; photo_weekly_cap — тижневий ліміт балів на гравця;
-- photos_chat_id / photos_thread_id / photos_guard_general — прив'язка топіка (ставить /setphotos);
-- callsign_change_cost — ціна зміни позивного в магазині (Squad Leader+ — безкоштовно, у коді).
insert into settings (key, value) values
  ('feature_photo_award',  'true'),
  ('pts_photo_post',       '1'),
  ('photo_weekly_cap',     '5'),
  ('photos_chat_id',       ''),
  ('photos_thread_id',     ''),
  ('photos_guard_general', 'false'),
  ('callsign_change_cost', '50')
on conflict (key) do nothing;
