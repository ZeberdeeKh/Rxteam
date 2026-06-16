-- RX Team — Етап 18 (текст про оплату на рівні локації, у анонс перед disclaimer).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap17.sql.
--
-- Блок «Оплата» в анонсі може відрізнятися для кожної локації (різні полігони —
-- різні умови оплати). Тому текст зберігається на локації (payment_pl / payment_uk),
-- а не в глобальних settings. Редагується в адмінці → «Локації». В анонсі (Телеграм
-- і сайт) підставляється автоматично перед блоком Disclaimer (ann_disclaimer_*).
-- Порожнє значення → блок не виводиться.

alter table locations
  add column if not exists payment_pl text,  -- текст блоку «Оплата» (PL) для анонсу
  add column if not exists payment_uk text;  -- текст блоку «Оплата» (UA) для анонсу
