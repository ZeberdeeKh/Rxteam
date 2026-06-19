-- RX Team — Етап 31 (security backstop: незмінний інваріант балансу балів).
-- НЕОБОВ'ЯЗКОВО, але рекомендовано. Виконати в Supabase → SQL Editor.
--
-- Контекст: списання балів зроблено атомарним у коді (умовний UPDATE
-- `points_balance >= cost`, див. lib/economy.ts spendPoints + app/shop/actions.ts buyRank
-- + lib/bot.ts buyrank). Цей CHECK — остання лінія оборони на рівні БД: будь-який майбутній
-- баг, що спробує загнати баланс у мінус, впаде голосно, а не «сховається» під Math.max(0,…).
-- Ідемпотентно: можна виконувати повторно.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'players_points_balance_nonneg'
  ) then
    -- На випадок, якщо минулі баги вже залишили від'ємні значення — підрівнюємо до 0,
    -- інакше ALTER із CHECK не пройде.
    update players set points_balance = 0 where points_balance < 0;
    alter table players
      add constraint players_points_balance_nonneg check (points_balance >= 0);
  end if;
end $$;
