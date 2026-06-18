-- RX Team — Етап 29 (фікс гонки фіналізації альбому барахолки).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap28.sql.
--
-- ПРОБЛЕМА: збір фото альбому завантажував кожне фото в Storage (~1 с) ще під час
-- збору. Telegram шле фото альбому окремими апдейтами (підпис лише на одному). Якщо
-- фото з підписом доходило/заливалося пізніше за сусіднє, таймер фіналізації сусіда міг
-- спрацювати РАНІШЕ, ніж записався опис → альбом вважався «без опису» й ВИДАЛЯВСЯ
-- (2 з 3 фото зникали). ФІКС: збір лише швидко пише file_id; завантаження в Storage
-- відкладене на фіналізацію (коли всі фото й підпис уже зібрані) → гонки немає.

alter table marketplace_listings add column if not exists photo_file_ids text[] not null default '{}';

-- Стара сигнатура (з photo_url/storage_path/price) більше не потрібна — прибираємо.
drop function if exists mp_collect_album_photo(
  bigint, text, bigint, text, text, text, text, text, boolean, bigint, bigint, text, text
);

-- Новий збір: лише file_id (без завантаження). photo_urls/storage_paths лишаються
-- порожніми до фіналізації. Підпис/is_promo/tg_message_id — лише з фото, де є підпис.
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
  p_seller_display     text
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
    array[p_file_id], array[p_file_unique_id],
    p_description, coalesce(p_is_promo, false),
    p_seller_player_id, p_seller_tg_user_id, p_seller_tg_username, p_seller_display, now()
  )
  on conflict (tg_chat_id, media_group_id) where media_group_id is not null
  do update set
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
