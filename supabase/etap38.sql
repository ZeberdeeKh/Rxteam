-- RX Team — Етап 38 (ачивки: 4-й рівень «легендарна» + бали за нього).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap37.sql. Ідемпотентно.
--
-- Рівні ачивок: easy / mid / hard / legendary (легка / середня / складна / легендарна).
-- Колонка achievements.tier — вільний text (без enum/CHECK), тож новий рівень схеми не змінює.
-- Додаємо лише ключ балів за легендарний рівень (дефолт 40 — подвоєння ряду 5/10/20/40).
-- Бали за рівні редагуються в адмінці: /admin/achievements (панель «Бали за рівень», master-only).
insert into settings (key, value) values ('pts_ach_legendary', '40')
on conflict (key) do nothing;
