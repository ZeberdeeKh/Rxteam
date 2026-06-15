-- RX Team — Етап 17 (YouTube у блоці «Соцмережі» на лендінгу).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap16.sql.
--
-- Лінк на YouTube для блоку «Про нас» на головній. Керується майстром в адмінці
-- (вкладка «Соцмережі», поле social_youtube_url). Поки заглушка — значення порожнє,
-- тому блок показується як «скоро», доки майстер не впише посилання.
insert into settings (key, value) values
  ('social_youtube_url', '')
on conflict (key) do nothing;
