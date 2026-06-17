-- RX Team — Етап 26 (гард гілки «тільки медіа»: лишаємо фото/відео/документ, текст видаляємо).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap25.sql.
--
-- Гілка налаштовується командою /setmedia у потрібному топіку (зберігає
-- media_chat_id / media_thread_id / media_guard_general). Видалене текстове
-- повідомлення → ескалація покарань (лічильник media_violations):
--   1-ше → пояснення правил у приват; 2-ге → повторне (останнє) попередження;
--   3-тє і кожне наступне → мут у групі на 1 год + пояснення в приват.
-- Адміни групи та майстер — виняток (можуть писати текст).

-- Лічильник порушень у гілці «тільки медіа» (per користувач).
create table if not exists media_violations (
  tg_user_id bigint primary key,
  count      int not null default 0,
  last_at    timestamptz default now()
);

-- Перемикач гарду гілки «тільки медіа» (за замовчуванням увімкнено).
-- Поки media_chat_id не заданий — гард інертний.
insert into settings (key, value) values ('feature_media_guard', 'true')
on conflict (key) do nothing;
