-- RX Team — Етап 2.2b: багатий анонс
-- Виконати в Supabase → SQL Editor.

alter table games add column if not exists gather_at   timestamptz; -- збір
alter table games add column if not exists title       text;        -- назва (латиниця)
alter table games add column if not exists scenario_pl text;
alter table games add column if not exists scenario_uk text;

-- Постійні блоки анонсу (редагуватимуться пізніше на сайті)
insert into settings (key, value) values
('ann_coffee_pl', $$Rano i w trakcie gry kawa, herbata oraz ciasteczka na przekąskę.$$),
('ann_coffee_uk', $$З ранку та під час гри кава, чай та печиво на перекус.$$),
('ann_rental_pl', $$🔫 Dostępne są pełne zestawy sprzętu do wynajęcia dla początkujących.
Jeśli chcesz zagrać pierwszy raz — wszystko zapewnimy.
Aby zarezerwować — napisz prywatnie.$$),
('ann_rental_uk', $$🔫 Є повні комплекти спорядження для новачків в оренду. Якщо хочеш спробувати пограти вперше — усе надамо. Для бронювання — пиши в приват.$$),
('ann_transport_pl', $$🚗 Jeśli nie masz auta — możemy zabrać Cię z trzech różnych dzielnic Wrocławia.
Szczegóły transportu — w wątku „flood".$$),
('ann_transport_uk', $$🚗 Якщо не маєш авто — можемо підвезти з трьох різних районів Вроцлава. Подробиці щодо транспорту — в гілці «флуд».$$),
('ann_limits_pl', $$Limity:
SEMI
1.4J - CQB
2.4J - DMR (20+ metrów)
2.7J - 3.7J - Bolt, awu- lub czterotaktowa, zakazane w budynkach, dystans 30+ metrów$$),
('ann_limits_uk', $$Ліміти:
SEMI
1.4J - CQB
2.4J - DMR (20+ метрів)
2.7J - 3.7J - Снайперські гвинтівки 2 та 4 такти (30+ метрів)$$),
('ann_disclaimer_pl', $$‼️ Prosimy o wcześniejszą rejestrację na grę.
⚠️ Przychodząc grać z nami, potwierdzasz, że masz ukończone 18 lat i musisz mieć pełną świadomość, że nie ponosimy odpowiedzialności za Twoje zdrowie, życie ani za uszkodzenie Twoich rzeczy podczas gry.$$),
('ann_disclaimer_uk', $$‼️ Просимо зареєструватися на гру заздалегідь.
⚠️ Приходячи грати з нами, ти підтверджуєш, що тобі виповнилося 18 років і мусиш чітко розуміти, що ми не несемо відповідальності за твоє здоров'я, життя або пошкодження твоїх речей під час гри.$$)
on conflict (key) do nothing;
