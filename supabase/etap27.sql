-- RX Team — Етап 27 (щоденне групове нагадування про реєстрацію + конфігуровне вікно чек-іну).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap26.sql.
--
-- 1) Щоденне нагадування у гілці «Флуд/Zalew»: щодня о daily_reminder_hour (Europe/Warsaw),
--    якщо цього КАЛЕНДАРНОГО тижня (Пн–Нд) попереду є анонсована гра — бот постить у гілку
--    ДВОМОВНЕ (UA+PL) нагадування про реєстрацію з посиланням на сайт /games.
--    Токени в тексті: {locations} = назви локацій ігор цього тижня, {link} = {site_url}/games.
--    Гілка задається командою /setflood у потрібному топіку (flood_chat_id / flood_thread_id).
--    Поки flood_chat_id не заданий — нагадування інертне (як гард медіа).
--    Вкл/викл — у «Функції» (feature_daily_reminder). Ідемпотентність — daily_reminder_last_sent.
--    Запуск тим самим пінгером, що й решта /api/cron/reminders (раз на ~15 хв).
-- 2) Вікно чек-іну тепер конфігуровне: checkin_open_before_min (хв до збору),
--    checkin_close_after_min (хв після старту). Зміна в адмінці перераховує checkin_from/
--    checkin_to для всіх анонсованих майбутніх ігор (reg_closes/cancel лишаються 9 / 24 год).

insert into settings (key, value) values
  ('feature_daily_reminder',   'true'),
  ('daily_reminder_hour',      '18'),
  ('daily_reminder_text_uk',   'Нагадуємо, що на цьому тижні граємо на {locations}. Не забудь зареєструватися, якщо плануєш їхати — щоб не втратити свої бали. {link}'),
  ('daily_reminder_text_pl',   'Przypominamy, że w tym tygodniu gramy na {locations}. Nie zapomnij się zarejestrować, jeśli planujesz przyjechać — żeby nie stracić punktów. {link}'),
  ('checkin_open_before_min',  '30'),
  ('checkin_close_after_min',  '60')
on conflict (key) do nothing;
