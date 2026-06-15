-- RX Team — Етап 14 (статус видачі покупок для адмінки магазину).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap13.sql.
--
-- Журнал покупок в адмінці магазину показує, хто що купив, і дозволяє
-- позначити «видано». Додаємо до purchases прапорець видачі та час.

alter table purchases
  add column if not exists fulfilled    boolean not null default false,  -- видано гравцю
  add column if not exists fulfilled_at timestamptz;                       -- коли позначено виданим

-- Бекфіл: усі вже наявні покупки вважаємо виданими (історичні, оброблені до фічі),
-- щоб у «очікують видачі» потрапляли лише нові покупки після цього етапу.
update purchases set fulfilled = true where fulfilled = false;

create index if not exists idx_purchases_fulfilled on purchases (fulfilled);
