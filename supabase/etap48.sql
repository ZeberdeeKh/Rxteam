-- RX Team — Етап 48 (барахолка: дозволити ВІДЕО в альбомі оголошення).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap47.sql. Ідемпотентно (drop + create or replace).
--
-- ЩО ЗМІНЮЄТЬСЯ: у гілці «Барахолка» альбом оголошення тепер може містити не лише фото,
-- а й відео. Відео лишається в гілці разом з фото й дає альбому свій підпис (#promo/опис),
-- АЛЕ на сайт rxteam.pl не заливається (сайт показує лише фото). Одиночне відео (без
-- альбому) — як і раніше видаляється гардом. Решта правил гілки без змін.
--
-- РЕАЛІЗАЦІЯ: у mp_collect_album_photo додано p_is_video. Коли true — кадр фіксується
-- (tg_message_ids для /delete, підпис/is_promo/seller), але його file_id НЕ додається в
-- photo_file_ids (інакше фіналізація спробувала б залити відео як фото й зламала б картку).

-- Прибираємо стару сигнатуру (11 арг., без p_is_video), щоб create нижче не породив
-- другий overload — PostgREST не має плутатися між двома функціями з тим самим ім'ям.
drop function if exists mp_collect_album_photo(
  bigint, text, bigint, text, text, text, boolean, bigint, bigint, text, text
);

create or replace function mp_collect_album_photo(
  p_chat_id            bigint,
  p_media_group_id     text,
  p_message_id         bigint,
  p_file_id            text,
  p_file_unique_id     text,
  p_description        text,
  p_is_promo           boolean,
  p_seller_player_id   bigint,
  p_seller_tg_user_id  bigint,
  p_seller_tg_username text,
  p_seller_display     text,
  p_is_video           boolean default false
) returns bigint as $$
declare v_id bigint;
begin
  insert into marketplace_listings (
    status, tg_chat_id, media_group_id, tg_message_id, tg_message_ids,
    photo_file_ids, photo_file_unique_ids,
    description, is_promo,
    seller_player_id, seller_tg_user_id, seller_tg_username, seller_display, updated_at
  ) values (
    'collecting', p_chat_id, p_media_group_id,
    case when p_description is not null then p_message_id else null end,
    array[p_message_id],
    -- Відео не додаємо до фото-масивів (тільки фото їдуть на сайт).
    case when p_is_video then '{}'::text[] else array[p_file_id] end,
    case when p_is_video then '{}'::text[] else array[p_file_unique_id] end,
    p_description, coalesce(p_is_promo, false),
    p_seller_player_id, p_seller_tg_user_id, p_seller_tg_username, p_seller_display, now()
  )
  on conflict (tg_chat_id, media_group_id) where media_group_id is not null
  do update set
    -- Для відео excluded.photo_file_ids = '{}', тож `|| excluded` — це no-op (фото не додається).
    tg_message_ids        = marketplace_listings.tg_message_ids || excluded.tg_message_ids,
    photo_file_ids        = marketplace_listings.photo_file_ids || excluded.photo_file_ids,
    photo_file_unique_ids = marketplace_listings.photo_file_unique_ids || excluded.photo_file_unique_ids,
    description           = coalesce(marketplace_listings.description, excluded.description),
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
