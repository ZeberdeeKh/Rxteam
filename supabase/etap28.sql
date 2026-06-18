-- RX Team — Етап 28 (Барахолка / Marketplace: дзеркало гілки продажів на сайт).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap27.sql.
--
-- Член команди постить ФОТО (одне або альбом) З ОПИСОМ у гілку продажів. Гілка —
-- лише для фото з описом (гард, аналог media-guard, але строгіший): текст/відео/файли,
-- а також фото БЕЗ опису → видаляються; порушнику DM. Налаштовується /setsales.
--
-- Публікація на сайт /marketplace — ДОБРОВІЛЬНА: лише якщо в описі є тег #promo
-- І у автора є патч. Тег #promo вирізається з опису. Модерація: нове = 'pending';
-- апрувнути може будь-який учасник адмін-групи (chores_chat_id) кнопкою, АБО адмін у
-- веб-адмінці. На сайті видно лише 'approved'. Зняття: гравець відповідає /delete на
-- своє оголошення (або репостить потрібне й відповідає /delete). Авто-протермінування
-- через marketplace_expiry_days (перемикач marketplace_expiry_enabled). Альбом збирається
-- в ОДНЕ оголошення (агрегація за media_group_id, фінал — debounce у боті).
--
-- ВАЖЛИВО: створи ПУБЛІЧНИЙ Storage-bucket `marketplace` (Dashboard → Storage),
-- ліміт файлу ~2 МБ (Telegram стискає фото, зазвичай < 300 КБ).

create table if not exists marketplace_listings (
  id                    bigint generated always as identity primary key,
  status                text not null default 'pending',
    -- collecting | pending | approved | rejected | deleted | expired | hidden
  description           text,                          -- підпис без тегу #promo
  price                 text,                          -- опц. (вільний текст; v1 не парсить)
  photo_urls            text[] not null default '{}',  -- публічні CDN-URL (альбом = кілька)
  storage_paths         text[] not null default '{}',  -- шляхи в bucket (для прибирання)
  photo_file_unique_ids text[] not null default '{}',  -- для матчингу репоста при /delete
  tg_chat_id            bigint not null,
  tg_message_id         bigint,                         -- id повідомлення з підписом (ціль reply /delete)
  tg_message_ids        bigint[] not null default '{}', -- усі повідомлення альбому (видалити в ТГ)
  media_group_id        text,                           -- альбом: спільний id (null для одиночного)
  is_promo              boolean not null default false,
  seller_player_id      bigint references players(id) on delete set null,
  seller_tg_user_id     bigint,
  seller_tg_username    text,
  seller_display        text,
  approval_claimed_at   timestamptz,                    -- лок фіналізації альбому
  approved_at           timestamptz,
  approved_by           bigint references players(id) on delete set null,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_marketplace_status  on marketplace_listings (status);
create index if not exists idx_marketplace_created  on marketplace_listings (created_at);
create index if not exists idx_marketplace_uids     on marketplace_listings using gin (photo_file_unique_ids);
-- Дедуп ретраїв вебхука для одиночного фото. БЕЗ partial WHERE — щоб PostgREST міг
-- використати індекс як ціль on_conflict у supabase-js upsert. NULL-tg_message_id
-- (рядки альбому в процесі збору) у Postgres вважаються різними → не конфліктують.
create unique index if not exists uq_marketplace_chat_msg
  on marketplace_listings (tg_chat_id, tg_message_id);
-- Агрегація альбому: один альбом = один рядок (точка ON CONFLICT у mp_collect_album_photo).
create unique index if not exists uq_marketplace_album
  on marketplace_listings (tg_chat_id, media_group_id)
  where media_group_id is not null;

-- Лічильник порушень у гілці продажів (per користувач) — копія media_violations.
create table if not exists marketplace_violations (
  tg_user_id bigint primary key,
  count      int not null default 0,
  last_at    timestamptz default now()
);

-- Коли гравцю вже надіслано інфо/згоду про публікацію (щоб слати раз).
alter table players add column if not exists marketplace_info_sent_at timestamptz;

-- Атомарний збір одного фото альбому в один рядок (upsert + append масивів).
-- Підпис (description/price/is_promo) і tg_message_id ставляться лише з того фото,
-- де є підпис; решта лише дозбирує фото. seller_* — з першого фото (всі від одного автора).
create or replace function mp_collect_album_photo(
  p_chat_id            bigint,
  p_media_group_id     text,
  p_message_id         bigint,
  p_photo_url          text,
  p_storage_path       text,
  p_file_unique_id     text,
  p_description        text,
  p_price              text,
  p_is_promo           boolean,
  p_seller_player_id   bigint,
  p_seller_tg_user_id  bigint,
  p_seller_tg_username text,
  p_seller_display     text
) returns bigint as $$
declare v_id bigint;
begin
  insert into marketplace_listings (
    status, tg_chat_id, media_group_id, tg_message_id, tg_message_ids,
    photo_urls, storage_paths, photo_file_unique_ids,
    description, price, is_promo,
    seller_player_id, seller_tg_user_id, seller_tg_username, seller_display, updated_at
  ) values (
    'collecting', p_chat_id, p_media_group_id,
    case when p_description is not null then p_message_id else null end,
    array[p_message_id],
    array[p_photo_url], array[p_storage_path], array[p_file_unique_id],
    p_description, p_price, coalesce(p_is_promo, false),
    p_seller_player_id, p_seller_tg_user_id, p_seller_tg_username, p_seller_display, now()
  )
  on conflict (tg_chat_id, media_group_id) where media_group_id is not null
  do update set
    tg_message_ids        = marketplace_listings.tg_message_ids || excluded.tg_message_ids,
    photo_urls            = marketplace_listings.photo_urls || excluded.photo_urls,
    storage_paths         = marketplace_listings.storage_paths || excluded.storage_paths,
    photo_file_unique_ids = marketplace_listings.photo_file_unique_ids || excluded.photo_file_unique_ids,
    description           = coalesce(marketplace_listings.description, excluded.description),
    price                 = coalesce(marketplace_listings.price, excluded.price),
    is_promo              = marketplace_listings.is_promo or excluded.is_promo,
    tg_message_id         = coalesce(marketplace_listings.tg_message_id,
                                     case when p_description is not null then p_message_id else null end),
    seller_player_id      = coalesce(marketplace_listings.seller_player_id, excluded.seller_player_id),
    seller_tg_user_id     = coalesce(marketplace_listings.seller_tg_user_id, excluded.seller_tg_user_id),
    seller_tg_username    = coalesce(marketplace_listings.seller_tg_username, excluded.seller_tg_username),
    seller_display        = coalesce(marketplace_listings.seller_display, excluded.seller_display),
    updated_at            = now()
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql;

-- Налаштування барахолки (інертна, поки sales_chat_id не задано через /setsales).
insert into settings (key, value) values
  ('feature_marketplace',       'true'),
  ('marketplace_require_patch',  'true'),   -- чи потрібен патч для публікації на сайт
  ('marketplace_expiry_enabled', 'true'),   -- авто-протермінування approved
  ('marketplace_expiry_days',    '30'),
  ('sales_chat_id',              ''),        -- ставить /setsales
  ('sales_thread_id',            ''),        -- ставить /setsales
  ('sales_guard_general',        'false'),   -- true якщо гілка = головна «General»
  ('marketplace_bucket',         'marketplace'),
  ('marketplace_promo_tag',      '#promo'),
  ('marketplace_flood_hint',     'Обговорення — у приваті з продавцем або в гілці «Zalew» (флуд).'),
  ('marketplace_patch_hint',     'Публікація на сайт доступна власникам патча. Подати заявку: /patch')
on conflict (key) do nothing;
