-- RX Team — Етап 12 (ліміти за типами реплік + піро/режим вогню на локацію).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap11.sql.
--
-- Типи реплік фіксовані в коді (lib/replicas.ts); тексти лімітів — у settings
-- (limit_<code>_pl / limit_<code>_uk), редагуються в адмінці «Налаштування».
-- Тут — лише вибір на рівні локації: які типи допущені, стан піро та режим вогню.
-- Старий єдиний блок ann_limits_* більше не використовується в анонсі.

alter table locations
  add column if not exists replica_types text[] not null default '{}',  -- допущені типи: cqb|dmr|sniper|pistol|lmg
  add column if not exists pyro          text not null default 'no',     -- yes | no | limited
  add column if not exists pyro_note     text,                            -- уточнення для «з обмеженням»
  add column if not exists fire_mode     text not null default 'semi';   -- auto | semi
