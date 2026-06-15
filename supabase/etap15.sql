-- RX Team — Етап 15 (фото-галерея; ручне завантаження з адмінки).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap14.sql.
--
-- Фото завантажує адмін із правом `gallery` (підпункт «Galeria» в адмінці) у
-- ПУБЛІЧНИЙ Storage-bucket `gallery`. Сайт /gallery показує ВИПАДКОВУ вибірку
-- зі status='visible'. Telegram-автозбір — відкладено (див. PLAN.md, Roadmap).

create table if not exists gallery_media (
  id            bigint generated always as identity primary key,
  storage_path  text not null,                        -- шлях у bucket: photos/<uuid>.<ext>
  public_url    text not null,                         -- публічний CDN-URL зі Storage
  caption       text,                                  -- підпис (опц.)
  file_size     int,
  status        text not null default 'visible',       -- visible | hidden
  uploaded_by   bigint references players(id) on delete set null,
  created_at    timestamptz default now()
);

create index if not exists idx_gallery_media_status  on gallery_media (status);
create index if not exists idx_gallery_media_created on gallery_media (created_at);

-- Прапор фічі (on/off у «Налаштуваннях») + конфіг бакета й кількості на сторінці.
insert into settings (key, value) values
  ('feature_gallery',       'true'),
  ('gallery_bucket',        'gallery'),
  ('gallery_display_limit', '24')
on conflict (key) do nothing;
