-- RX Team — Етап 22 (дозволи адмінів = пункти субменю: бекфіл наявних ролей).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap21.sql. Деплой коду — разом із міграцією.
--
-- Схема не міняється: admin_perms — це text[] (etap2.sql), нові ключі — просто рядки.
-- Цей бекфіл лише зберігає доступ існуючим адмінам після двох змін:
--   1) «games» розділено на «games» + «locations»;
--   2) «checkin» злито в «games».

-- 1) Хто мав games → додаємо locations (щоб не втратив доступ до локацій).
update players
   set admin_perms = array_append(admin_perms, 'locations')
 where 'games' = any(admin_perms)
   and not ('locations' = any(admin_perms));

-- 2) Хто мав checkin → отримує games (відмітка явки тепер у межах games).
update players
   set admin_perms = array_append(admin_perms, 'games')
 where 'checkin' = any(admin_perms)
   and not ('games' = any(admin_perms));

-- 3) Прибираємо застарілий ключ checkin (більше не використовується).
update players
   set admin_perms = array_remove(admin_perms, 'checkin')
 where 'checkin' = any(admin_perms);
