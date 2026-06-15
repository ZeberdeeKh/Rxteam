-- RX Team — Етап 16 (пінг адмінів у чек-листі підготовки до гри).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap15.sql.
--
-- Список @нікнеймів, яких бот пінгує при постингу чек-листа в адмін-групу
-- (lib/chores.ts → fetchAdminMentions). Роздільник — пробіл або кома; @ можна
-- не ставити (додасться автоматично). Редагується з адмінки → «Ogólne».
insert into settings (key, value) values
  ('chores_admin_mentions', '@BETEP_OK @BaRon25cm @Delltex @a_miller1 @Mark_95V')
on conflict (key) do nothing;
