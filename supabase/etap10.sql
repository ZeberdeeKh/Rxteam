-- RX Team — Етап 10 (соцмережі на лендінгу + керування лінками з адмінки «Соцмережі»).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap9.sql.

-- Лінки на соцмережі для блоку «Про нас» на головній.
-- Керуються майстром в адмінці (вкладка «Соцмережі»). Порожнє значення / відсутній ключ
-- => блок показується як «скоро» (поки що Facebook — заглушка, лінк додамо пізніше).
insert into settings (key, value) values
  ('social_instagram_url', 'https://www.instagram.com/rxteam.pl'),
  ('social_telegram_url',  'https://t.me/rxteampl'),
  ('social_tiktok_url',    'https://www.tiktok.com/@rxteam.pl')
on conflict (key) do nothing;
