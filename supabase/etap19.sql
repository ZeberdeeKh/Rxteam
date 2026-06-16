-- RX Team — Етап 19 (двомовне «Уточнення піро» на рівні локації).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap18.sql. Деплой коду — разом із міграцією.
--
-- Старе поле pyro_note було одне на дві мови — в анонсі той самий текст дописувався
-- і в PL-, і в UA-блок (змішування мов). Розділяємо на pyro_note_pl / pyro_note_uk,
-- як payment_*. Існуючий текст копіюємо в обидві мови (повторює поточну поведінку),
-- потім прибираємо старий стовпець.

alter table locations
  add column if not exists pyro_note_pl text,  -- уточнення піро (PL) для анонсу «з обмеженням»
  add column if not exists pyro_note_uk text;  -- уточнення піро (UA) для анонсу «з обмеженням»

update locations
  set pyro_note_pl = pyro_note,
      pyro_note_uk = pyro_note
  where pyro_note is not null;

alter table locations drop column if exists pyro_note;
