-- RX Team — Етап 13 (чек-лист підготовки до гри для адмін-групи).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap12.sql.
--
-- При анонсі гри бот постить у закриту адмін-групу інтерактивний список:
--   • Дії (зарядити батареї, закупи…) та Взяти на гру (стіл, чайник, пункти домінації…).
-- Кожен тицяє пункт і «бере» його на себе (одна людина на пункт). У п'ятницю 22:00
-- бот шле звіт і закриває список. Наступна гра → новий run (обнулення).
--
-- chore_templates — каталог пунктів (редагує master в адмінці /admin/chores).
-- chore_runs      — один інстанс на гру (знімок каталогу на момент анонсу).
-- chore_run_items — пункти конкретного run + хто взяв (single-claim у колонках).

create table if not exists chore_templates (
  id         bigint generated always as identity primary key,
  kind       text not null,                 -- 'action' | 'gear'
  label      text not null,                 -- UA текст (короткий, на кнопку)
  note       text,                           -- опис під пунктом (напр. список покупок)
  sort_order int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists chore_runs (
  id          bigint generated always as identity primary key,
  game_id     bigint not null unique references games(id) on delete cascade,
  chat_id     bigint,
  thread_id   bigint,
  message_id  bigint,
  status      text not null default 'open', -- 'open' | 'reported'
  report_at   timestamptz not null,         -- пт 22:00 (Europe/Warsaw) перед грою
  posted_at   timestamptz default now(),
  reported_at timestamptz
);

create index if not exists chore_runs_due_idx on chore_runs (status, report_at);

create table if not exists chore_run_items (
  id            bigint generated always as identity primary key,
  run_id        bigint not null references chore_runs(id) on delete cascade,
  kind          text not null,               -- 'action' | 'gear'
  label         text not null,               -- знімок тексту з шаблону
  note          text,                         -- знімок опису з шаблону
  sort_order    int not null default 0,
  claimed_tg_id bigint,                       -- хто взяв (null = вільно)
  claimed_name  text,
  claimed_at    timestamptz
);

create index if not exists chore_run_items_run_idx on chore_run_items (run_id);

-- Колонка note (ідемпотентно — на випадок, якщо таблиці вже створено без неї).
alter table chore_templates add column if not exists note text;
alter table chore_run_items  add column if not exists note text;

-- Сід каталогу (їхні пункти). Ідемпотентно по label: вставляє лише ті,
-- яких ще нема, тож працює і на чистій базі, і якщо стара версія вже виконана.
insert into chore_templates (kind, label, note, sort_order)
select v.kind, v.label, v.note, v.sort_order
from (values
  ('action', 'Зарядити батареї на репліки', cast(null as text), 10),
  ('action', 'Зарядити батареї на пункти домінації', null, 20),
  ('action', 'Зробити закупи на гру', 'чай, кава, цукор, стаканчики, молоко, печиво, вода 15л', 30),
  ('action', 'Перевірити наявність кульок і при необхідності купити', null, 40),
  ('action', 'Перевірити наявність скотчу і при необхідності купити', null, 50),
  ('action', 'Перевірити наявність газу і при необхідності купити', null, 60),
  ('gear',   'Орендні репліки', null, 10),
  ('gear',   'Екіпіровка', null, 20),
  ('gear',   'Стіл', null, 30),
  ('gear',   'Чайник', null, 40),
  ('gear',   'Печка', null, 50),
  ('gear',   'Пункти домінації', null, 60)
) as v(kind, label, note, sort_order)
where not exists (select 1 from chore_templates t where t.label = v.label);

-- Опис до «закупи» — проставити, навіть якщо рядок уже існував без нього.
update chore_templates
set note = 'чай, кава, цукор, стаканчики, молоко, печиво, вода 15л'
where label = 'Зробити закупи на гру' and (note is null or note = '');
