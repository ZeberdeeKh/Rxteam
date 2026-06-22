-- RX Team — Етап 34 (карпул-мапа: точка виїзду водія + бронювання місць).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap33.sql.
-- Сайт і бот працюють зі СПІЛЬНИМИ таблицями. Ідемпотентно: можна виконувати повторно.
--
-- 1) Координати точки виїзду водія — на наявному рядку registrations (1:1 з реєстрацією).
--    Пише і сайт (пін на мапі / «моя GPS»), і бот (надіслана локація). Ті самі дві колонки.
-- 2) Бронювання: таблиця ride_requests. Місце списується АТОМАРНО лише при accept (lib/carpool.ts).
-- 3) CHECK-бекстоп на free_seats (дзеркало etap31 для points_balance): від'ємне місце = баг, впаде голосно.
-- 4) feature_carpool_map — гейт сторінки /carpool і нових бот-входів бронювання.

-- ── 1) Координати точки виїзду (nullable) ──
alter table registrations add column if not exists from_lat double precision;
alter table registrations add column if not exists from_lng double precision;

-- ── 3) Незмінний інваріант: вільних місць не може бути менше нуля ──
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'registrations_free_seats_nonneg'
  ) then
    update registrations set free_seats = 0 where free_seats < 0;
    alter table registrations
      add constraint registrations_free_seats_nonneg check (free_seats is null or free_seats >= 0);
  end if;
end $$;

-- ── 2) Запити на місце (бронювання) ──
-- driver_player_id зберігаємо ЯВНО (не FK на registrations.id): стабільний натуральний ключ
-- game_id+player_id, яким уже оперує решта коду; переживає re-upsert реєстрації водія.
create table if not exists ride_requests (
  id               bigint generated always as identity primary key,
  game_id          bigint not null references games(id)   on delete cascade,
  driver_player_id bigint not null references players(id) on delete cascade,
  passenger_id     bigint not null references players(id) on delete cascade,
  status           text   not null default 'pending',  -- pending|accepted|declined|cancelled
  seats            int    not null default 1,
  created_at       timestamptz not null default now(),
  decided_at       timestamptz
);

-- Один відкритий (pending) запит на пару пасажир→водій у межах гри — ловить дубль/спам (23505).
create unique index if not exists uq_ride_req_open
  on ride_requests (game_id, driver_player_id, passenger_id)
  where status = 'pending';

-- Вхідні запити водія / вихідні пасажира / завантаження мапи гри.
create index if not exists idx_ride_req_driver    on ride_requests (game_id, driver_player_id, status);
create index if not exists idx_ride_req_passenger on ride_requests (passenger_id, status);

-- ── 4) Фічфлаг (за замовч. true через featureEnabled; вставляємо явно для видимості в адмінці) ──
insert into settings (key, value) values
  ('feature_carpool_map', 'true')
on conflict (key) do nothing;
