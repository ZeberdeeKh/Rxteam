-- RX Team — Етап 20 (SVG-мініатюра ачівки: base64 data URL у колонці achievements.thumbnail_svg).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap19.sql. Деплой коду — разом із міграцією.
--
-- Зберігаємо вже готовий рядок «data:image/svg+xml;base64,…» — показ через інертний <img>
-- (браузер рендерить як статичну картинку, скрипти/мережа всередині SVG не виконуються → XSS-safe).
-- Без індексу: колонка ніколи не у WHERE, лише SELECT за code.

alter table achievements
  add column if not exists thumbnail_svg text;
