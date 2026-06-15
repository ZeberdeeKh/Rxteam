-- RX Team — Етап 9 (фіча «Повідомити про помилку», перенесена з «Kalkulator»).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap8.sql.

-- Звіти про помилки від користувачів сайту. Дублюються в Telegram адмінам (lib/notify.ts),
-- але зберігаються тут для перегляду й анти-абузу (rate-limit рахується саме по цій таблиці).
create table if not exists bug_reports (
  id             bigint generated always as identity primary key,
  description    text not null,
  email          text,                    -- необов'язковий контакт автора
  ip             text,                     -- для rate-limit (5/год на IP)
  url            text,                     -- сторінка, з якої надіслано
  lang           text,                     -- мова інтерфейсу на момент звіту
  user_agent     text,
  meta           jsonb,                    -- повний контекст (viewport тощо)
  has_screenshot boolean not null default false,
  created_at     timestamptz default now()
);
create index if not exists idx_bug_reports_created on bug_reports (created_at);
create index if not exists idx_bug_reports_ip_created on bug_reports (ip, created_at);

-- Перемикач функції (за замовчуванням увімкнено).
insert into settings (key, value) values ('feature_bug_report', 'true')
on conflict (key) do nothing;
