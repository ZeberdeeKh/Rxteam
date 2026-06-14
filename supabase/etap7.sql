-- RX Team — Етап 7 (магазин за бали) -- НАЗВА ФАЙЛУ за домовленістю (6.3).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap6.sql.

-- Товари магазину (конфіг; наповнює організатор через адмінку 6.4).
create table if not exists shop_items (
  id         bigint generated always as identity primary key,
  title_pl   text,
  title_en   text,
  title_uk   text,
  desc_pl    text,
  desc_en    text,
  desc_uk    text,
  cost       int  not null default 0,         -- ціна в балах (доступний баланс)
  active     boolean not null default true,
  sort       int  not null default 0,         -- порядок показу
  created_at timestamptz default now()
);
create index if not exists idx_shop_items_active on shop_items (active);

-- Покупки (списання балансу зафіксовано також у point_log, reason='purchase').
create table if not exists purchases (
  id         bigint generated always as identity primary key,
  player_id  bigint references players(id) on delete cascade,
  item_id    bigint references shop_items(id) on delete set null,
  cost       int  not null,
  created_at timestamptz default now()
);
create index if not exists idx_purchases_player on purchases (player_id);

-- Перемикач функції (за замовчуванням увімкнено).
insert into settings (key, value) values ('feature_shop', 'true')
on conflict (key) do nothing;

-- Заглушки-приклади (організатор відредагує/вимкне через адмінку 6.4).
insert into shop_items (title_pl, title_en, title_uk, desc_pl, desc_en, desc_uk, cost, active, sort)
select * from (values
  ('[Przykład] Naszywka okolicznościowa', '[Example] Event patch', '[Приклад] Тематична нашивка',
   'Pozycja przykładowa — uzupełni organizator.', 'Placeholder item — to be filled by the organizer.', 'Приклад — наповнить організатор.',
   50, true, 10),
  ('[Przykład] Zniżka na wynajem', '[Example] Rental discount', '[Приклад] Знижка на оренду',
   'Pozycja przykładowa — uzupełni organizator.', 'Placeholder item — to be filled by the organizer.', 'Приклад — наповнить організатор.',
   100, true, 20)
) as v
where not exists (select 1 from shop_items);
