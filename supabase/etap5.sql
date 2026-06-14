-- RX Team — Етап 5 (нагадування)
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap4.sql.

-- Прапорці «нагадування надіслано» (щоб не дублювати при частих запусках крону).
alter table games add column if not exists reminded_day boolean not null default false;
alter table games add column if not exists reminded_2h  boolean not null default false;

insert into settings (key, value) values
  ('feature_reminders', 'true'),
  ('remind_day_hour',   '18'),   -- напередодні о цій годині (локальний час Вроцлава)
  ('remind_before_h',   '2')     -- друге нагадування за стільки годин до старту
on conflict (key) do nothing;
