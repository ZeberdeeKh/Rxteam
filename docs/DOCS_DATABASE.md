# База даних (Supabase)

Цей документ — консолідований опис поточної схеми БД проєкту RX Team. База — PostgreSQL під керуванням Supabase. Схема будується з базового файлу `supabase/schema.sql` плюс 20 пронумерованих міграцій (`etap2`…`etap19`, з гілками `2b`/`5b`/`5c`), які виконуються **вручну, по черзі**, у Supabase → SQL Editor. Усього 24 прикладні таблиці; **RLS вимкнено** — авторизація та валідація живуть у коді застосунку, а не в БД. Суміжні документи: `DOCS_OVERVIEW.md`, `DOCS_BACKEND.md`, `DOCS_BOT.md`, `DOCS_AUTH.md`, `DOCS_FRONTEND.md`.

## Підхід до міграцій

Окремого migration-runner / CLI немає. Схема відновлюється лише читанням **усіх 21 файлів у числовому порядку** (послідовність нерівномірна: `schema → 2 → 2b → 3 → 4 → 5 → 5b → 5c → 6 → 7 … → 19`). Кожен файл у заголовку явно вказує, після якого попереднього його запускати (напр. `etap3.sql:2` — «Виконати в Supabase → SQL Editor ПІСЛЯ etap2.sql / etap2b.sql»).

Ключові властивості процесу:

| Властивість | Деталь | Доказ |
|---|---|---|
| Ручне послідовне застосування | Кожен файл — окремий крок у SQL Editor, без раннера | `supabase/schema.sql:2`, `supabase/etap2.sql:2` |
| Ідемпотентність | Таблиці через `create table if not exists`, колонки через `add column if not exists` | `supabase/etap2.sql:5`, `supabase/etap12.sql:9` |
| Адитивність | Сіди через `on conflict (...) do nothing` або `where not exists` | `supabase/etap3.sql:54`, `supabase/etap7.sql:44` |
| Єдиний DROP | `etap19` прибирає застарілий `locations.pyro_note` — єдина деструктивна дія в усьому наборі | `supabase/etap19.sql:18` |

> **Важливо:** пізніші файли мутують ранні таблиці — `games` отримує колонки в `etap2/2b/5`; `locations` у `etap2/12/18/19`; `purchases` у `etap7/14`. Читання одного файлу дає неповну картину таблиці.

### Перелік файлів міграцій

| Файл | Що додає |
|---|---|
| `supabase/schema.sql` | `settings` (feature flags), `join_challenges` (капча); сіди `feature_shield`, `feature_onboarding_faq` |
| `supabase/etap2.sql` | Ядро: `players`, `locations`, `games`, `registrations`, `checkins`, `user_states`; сід `master_username='delltex'` |
| `supabase/etap2b.sql` | `games.gather_at/title/scenario_pl/scenario_uk`; сіди rich-announce блоків (`ann_*`) |
| `supabase/etap3.sql` | Економіка: `point_log`, `patch_requests`, `achievements`, `player_achievements`; сід 7 ачівок + `pts_*`/`rank_cost_*` |
| `supabase/etap4.sql` | `referrals` (inviter→invited, `unique(invited_id)`) |
| `supabase/etap5.sql` | `games.reminded_day/reminded_2h`; налаштування нагадувань |
| `supabase/etap5b.sql` | `polls` (Telegram-голосування за локацію) |
| `supabase/etap5c.sql` | `season_runs` (квартальна лотерея) |
| `supabase/etap6.sql` | `identities` + `link_codes` (зв'язка сайт↔Telegram) |
| `supabase/etap7.sql` | `shop_items` + `purchases` (магазин за бали); сід 2 прикладних товарів |
| `supabase/etap8.sql` | `group_members` (анти-абуз членства) |
| `supabase/etap9.sql` | `bug_reports` (звіти про помилки сайту) |
| `supabase/etap10.sql` | Сіди `social_*_url` (Instagram/Telegram/TikTok) |
| `supabase/etap11.sql` | `announce_violations` (лічильник модерації топіка анонсів) |
| `supabase/etap12.sql` | `locations.replica_types[]`, `pyro`, `pyro_note`, `fire_mode` |
| `supabase/etap13.sql` | `chore_templates`, `chore_runs`, `chore_run_items` (чек-лист підготовки); сід каталогу |
| `supabase/etap14.sql` | `purchases.fulfilled/fulfilled_at`; беклфіл наявних покупок як `fulfilled=true` |
| `supabase/etap15.sql` | `gallery_media`; сіди `feature_gallery`/`gallery_bucket`/`gallery_display_limit` |
| `supabase/etap16.sql` | Сід `chores_admin_mentions` |
| `supabase/etap17.sql` | Сід `social_youtube_url` (порожня заглушка) |
| `supabase/etap18.sql` | `locations.payment_pl/payment_uk` (блок оплати на локацію) |
| `supabase/etap19.sql` | Розділяє `locations.pyro_note` → `pyro_note_pl/pyro_note_uk`, копіює старе значення в обидва, дропає старий стовпець |

## RLS вимкнено

Пошук по всіх `supabase/*.sql` за `row level security`, `enable row`, `rls`, `policy` дає **нуль збігів** — жоден файл не вмикає Row Level Security і не визначає політик. Контроль доступу повністю на боці застосунку (див. `DOCS_AUTH.md`, `DOCS_BACKEND.md`). У поєднанні з відсутністю CHECK/enum-валідації статусів це означає, що БД повністю довіряє рівню коду і щодо авторизації, і щодо коректності даних.

## ER-огляд (як усе пов'язано)

```
                        settings (key/value config + feature flags)
                        — самостійна, без FK

  players (центральний профіль: ролі/права колонками)
    ├──< identities (provider telegram|email)              ─ вхід (сайт/TG)
    ├──< link_codes (одноразові 6-символьні коди)          ─ /linksite
    ├──< registrations  >── games >── locations            ─ життєвий цикл гри
    ├──< checkins       >── games                          ─ гео-чек-ін
    ├──< point_log      >── games (SET NULL)               ─ журнал балів
    ├──< player_achievements >── achievements              ─ здобуті ачівки
    │                        >── games (SET NULL)
    ├──< patch_requests   (decided_by → players SET NULL)  ─ заявки на патч
    ├──< referrals (inviter_id, invited_id) >── games      ─ реферали
    ├──< purchases >── shop_items (SET NULL)               ─ магазин
    └──< gallery_media (uploaded_by SET NULL)              ─ галерея

  games ──1:1── chore_runs ──< chore_run_items             ─ чек-лист підготовки
  chore_templates (каталог)  ─ знімок копіюється в run_items

  season_runs (winner_id → players SET NULL)               ─ квартальна лотерея
  polls (location_ids[])                                   ─ голосування за локацію
  group_members / announce_violations / user_states / bug_reports / join_challenges
    — допоміжні, прив'язані за tg_user_id (не FK)
```

Ключова бізнес-логіка зв'язків:

- **«Зіграна гра» (+1)** — це комбінація `registrations` AND `checkins` (обидві `unique(game_id, player_id)`), що рахується **в коді**, а не одним рядком чи тригером; `players.games_played` веде застосунок (`supabase/etap2.sql:12`, `:67`).
- **Бали** розділені на три лічильники в `players`: `games_played`, `points_earned` (рейтинг «зароблено всього», тільки зростає), `points_balance` (доступний баланс). Кожен рух журналюється в `point_log` (`supabase/etap2.sql:12–14`, `supabase/etap3.sql:6`).
- **Реферал** — один новачок = один запрошувач (`referrals.invited_id unique`), із `game_id` першого чек-іну новачка (`supabase/etap4.sql`).

## Таблиці та колонки

### Конфіг і feature-flags

#### `settings` — центральне сховище конфігу (`supabase/schema.sql:5`)

| Колонка | Тип | Примітки |
|---|---|---|
| `key` | text PK | |
| `value` | text | усе зберігається як рядок (числа/булеві теж) |
| `updated_at` | timestamptz default now() | |

Key/value-store для feature-флагів (`feature_*`), параметрів економіки (`pts_*`, `rank_cost_*`, `no_patch_multiplier='0.85'`), таймінгу нагадувань, соц-URL (`social_*_url`), текстових блоків анонсу (`ann_*`), текстів лімітів за репліками (`limit_<code>_pl/uk` — за коментарем `etap12`), `chores_admin_mentions` та бутстрапу `master_username='delltex'`. Сіди розкидані майже по кожному файлу. `patch_price_zl` сідиться порожнім (`''`) як заглушка для майстер-адміна (`supabase/etap3.sql:68`).

#### `join_challenges` — капча для заявок на вступ (`supabase/schema.sql:17`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `chat_id` | bigint NN | |
| `user_id` | bigint NN | |
| `user_chat_id` | bigint NN | |
| `answer` | int NN | |
| `lang` | text NN default 'en' | |
| `status` | text NN default 'pending' | `pending\|passed\|failed\|expired` |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz NN | |

`unique(chat_id, user_id)`, індекс по `status`.

### Ядро: гравці, локації, ігри, реєстрації, чек-іни

#### `players` — профіль особи + ролі/права (`supabase/etap2.sql:5`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `tg_user_id` | bigint UNIQUE | |
| `name` | text | |
| `tg_username` | text | |
| `callsign` | text UNIQUE | позивний, вписується при першій реєстрації |
| `lang` | text default 'uk' | |
| `games_played` | int NN d0 | реєстрація + чек-ін |
| `points_earned` | int NN d0 | «зароблено всього» (рейтинг, тільки вгору) |
| `points_balance` | int NN d0 | доступний баланс |
| `has_patch` | boolean NN d false | |
| `rank` | text | |
| `is_admin` | boolean NN d false | |
| `is_master` | boolean NN d false | |
| `admin_perms` | text[] d '{}' | `games\|rental\|checkin\|referrals\|players\|joins` |
| `created_at` | timestamptz | |

> Ролей/прав як окремих таблиць немає — вони денормалізовані на `players`. Дозволи в `admin_perms` — вільні рядки масиву без довідника; помилки набору БД не зловить.

#### `locations` — полігони (`supabase/etap2.sql:24`, доповнено в `etap12/18/19`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `name` | text NN | |
| `lat` | double precision NN | |
| `lng` | double precision NN | |
| `radius_m` | int NN d300 | |
| `map_url` | text | |
| `created_at` | timestamptz | |
| `replica_types` | text[] NN d'{}' | `cqb\|dmr\|sniper\|pistol\|lmg` (etap12) |
| `pyro` | text NN d'no' | `yes\|no\|limited` (etap12) |
| `fire_mode` | text NN d'semi' | `auto\|semi` (etap12) |
| `payment_pl` | text | блок оплати PL (etap18) |
| `payment_uk` | text | блок оплати UA (etap18) |
| `pyro_note_pl` | text | уточнення піро PL (etap19) |
| `pyro_note_uk` | text | уточнення піро UA (etap19) |

Старий єдиний `pyro_note` дропнуто в `etap19`.

#### `games` — ігри (`supabase/etap2.sql:35`, доповнено в `etap2b/5`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `location_id` | bigint FK→`locations(id)` | |
| `title` | text | |
| `start_at` | timestamptz NN | |
| `reg_closes_at` | timestamptz | старт − 9 год |
| `cancel_deadline` | timestamptz | старт − 24 год |
| `checkin_from` | timestamptz | старт − 1 год |
| `checkin_to` | timestamptz | старт + 1 год |
| `capacity` | int | null = без ліміту |
| `status` | text NN d'announced' | `announced\|finished\|cancelled` |
| `announce_chat_id` | bigint | |
| `announce_thread_id` | bigint | |
| `announce_message_id` | bigint | |
| `created_at` | timestamptz | |
| `gather_at` | timestamptz | (etap2b) |
| `scenario_pl` | text | (etap2b) |
| `scenario_uk` | text | (etap2b) |
| `reminded_day` | boolean NN d false | (etap5) |
| `reminded_2h` | boolean NN d false | (etap5) |

#### `registrations` — реєстрації (`supabase/etap2.sql:53`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `game_id` | bigint FK→`games(id)` ON DELETE CASCADE | |
| `player_id` | bigint FK→`players(id)` CASCADE | |
| `status` | text NN d'registered' | `registered\|cancelled\|no_show` |
| `needs_rental` | boolean d false | |
| `transport` | text | `own\|need` |
| `from_place` | text | |
| `free_seats` | int | |
| `seats_closed` | boolean d false | |
| `created_at` | timestamptz | |

`unique(game_id, player_id)`.

#### `checkins` — чек-іни (`supabase/etap2.sql:68`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `game_id` | bigint FK→`games` CASCADE | |
| `player_id` | bigint FK→`players` CASCADE | |
| `lat` | double precision | |
| `lng` | double precision | |
| `distance_m` | int | |
| `source` | text d'tg' | `tg\|web` |
| `is_manual` | boolean d false | |
| `created_at` | timestamptz | |

`unique(game_id, player_id)`.

#### `user_states` — стан діалогів бота (`supabase/etap2.sql:82`)

| Колонка | Тип | Примітки |
|---|---|---|
| `tg_user_id` | bigint PK | |
| `state` | text | |
| `data` | jsonb d'{}' | |
| `updated_at` | timestamptz | |

### Економіка балів

#### `point_log` — журнал балів (append-only) (`supabase/etap3.sql:6`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `player_id` | bigint FK→`players` CASCADE | |
| `delta` | int NN | фактично (вже з множником 85% для заробітку) |
| `reason` | text NN | `attend\|noshow\|friend\|achievement\|rank_purchase\|manual\|purchase` |
| `game_id` | bigint FK→`games` ON DELETE SET NULL | |
| `meta` | text | код ачівки/рангу тощо |
| `created_at` | timestamptz | |

Індекс по `player_id`. `no_patch_multiplier=0.85` (settings) застосовує 85%-й множник заробітку для гравців без патча (`supabase/etap3.sql:67`).

#### `patch_requests` — заявки на патч (`supabase/etap3.sql:18`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `player_id` | bigint FK→`players` CASCADE | |
| `status` | text NN d'requested' | `requested\|approved\|handed\|rejected` |
| `created_at` | timestamptz | |
| `decided_at` | timestamptz | |
| `decided_by` | bigint FK→`players` ON DELETE SET NULL | |

Індекс по `status`.

#### `achievements` — конфіг ачівок (`supabase/etap3.sql:29`)

| Колонка | Тип | Примітки |
|---|---|---|
| `code` | text PK | |
| `title_pl` / `title_en` / `title_uk` | text | |
| `tier` | text NN d'mid' | `easy\|mid\|hard\|legendary` (визначає бали `pts_ach_*`) |
| `enabled` | boolean NN d true | |

Сід 7 кодів: `first_contact`, `deploy_10`, `deploy_25`, `deploy_50`, `recruiter`, `dawn_patrol`, `iron_discipline`.

#### `player_achievements` — здобуті ачівки (`supabase/etap3.sql:36`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `player_id` | bigint FK→`players` CASCADE | |
| `code` | text FK→`achievements(code)` | |
| `game_id` | bigint FK→`games` ON DELETE SET NULL | |
| `created_at` | timestamptz | |

`unique(player_id, code)`.

### Реферали та анти-абуз

#### `referrals` — реферали (`supabase/etap4.sql:5`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `inviter_id` | bigint FK→`players` CASCADE | |
| `invited_id` | bigint FK→`players` CASCADE | |
| `game_id` | bigint FK→`games` ON DELETE SET NULL | гра першого чек-іну новачка |
| `status` | text NN d'pending' | `pending\|confirmed\|rejected` |
| `photo` | text | не використовується |
| `created_at` | timestamptz | |
| `confirmed_at` | timestamptz | |

`unique(invited_id)` — один новачок = один запрошувач. Індекс по `inviter_id`.

#### `group_members` — членство для анти-абузу (`supabase/etap8.sql:9`)

| Колонка | Тип | Примітки |
|---|---|---|
| `tg_user_id` | bigint PK | |
| `status` | text NN d'member' | `member\|left` |
| `first_seen` | timestamptz d now() | |
| `last_seen` | timestamptz d now() | |
| `left_at` | timestamptz | `≠null` = колись виходив |

Індекс по `status`. Блокує реферальні бонуси для тих, хто повторно зайшов.

#### `announce_violations` — лічильник модерації (`supabase/etap11.sql:7`)

| Колонка | Тип | Примітки |
|---|---|---|
| `tg_user_id` | bigint PK | |
| `count` | int NN d0 | |
| `last_at` | timestamptz d now() | |

Лічильник порушень для bot-only топіка «Анонси ігор».

### Голосування й лотерея

#### `polls` — Telegram-голосування за локацію (`supabase/etap5b.sql:5`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `tg_poll_id` | text | |
| `chat_id` / `message_id` / `thread_id` | bigint | |
| `location_ids` | bigint[] | порядок = порядок опцій у Telegram |
| `status` | text NN d'open' | `open\|closed` |
| `created_at` / `closed_at` | timestamptz | |

Індекс по `status`.

#### `season_runs` — квартальна лотерея лояльності (`supabase/etap5c.sql:6`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `quarter` | text UNIQUE | напр. `'Q2 2026'` |
| `winner_id` | bigint FK→`players` ON DELETE SET NULL | |
| `eligible_count` | int d0 | |
| `run_at` | timestamptz d now() | |

### Ідентичність / вхід

#### `identities` — один профіль ↔ кілька способів входу (`supabase/etap6.sql:7`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `player_id` | bigint NN FK→`players` CASCADE | |
| `provider` | text NN | `'telegram'` \| `'email'` |
| `external_id` | text NN | для `telegram` = `players.tg_user_id`; для `email` = `auth.users.id` (uuid) |
| `verified` | boolean NN d false | |
| `created_at` | timestamptz | |

`unique(provider, external_id)`, індекс по `player_id`.

#### `link_codes` — одноразові коди прив'язки сайт↔Telegram (`supabase/etap6.sql:19`)

| Колонка | Тип | Примітки |
|---|---|---|
| `code` | text PK | 6-символьний |
| `player_id` | bigint NN FK→`players` CASCADE | |
| `expires_at` | timestamptz NN | |
| `used_at` | timestamptz | |
| `created_at` | timestamptz | |

Індекс по `player_id`. Видає бот командою `/linksite`. Деталі моделі входу — у `DOCS_AUTH.md`.

> **Таблиці сесій у цих міграціях немає.** Auth-сесії/користувачі живуть у керованому Supabase `auth.users` (на нього посилається `identities.external_id` для провайдера `email`), що поза цими SQL-файлами.

### Магазин за бали

#### `shop_items` — товари (`supabase/etap7.sql:5`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `title_pl` / `title_en` / `title_uk` | text | |
| `desc_pl` / `desc_en` / `desc_uk` | text | |
| `cost` | int NN d0 | ціна в балах (доступний баланс) |
| `active` | boolean NN d true | |
| `sort` | int NN d0 | |
| `created_at` | timestamptz | |

Індекс по `active`. Сід 2 прикладних товарів.

#### `purchases` — покупки (`supabase/etap7.sql:21`, доповнено в `etap14`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `player_id` | bigint FK→`players` CASCADE | |
| `item_id` | bigint FK→`shop_items` ON DELETE SET NULL | |
| `cost` | int NN | |
| `created_at` | timestamptz | |
| `fulfilled` | boolean NN d false | (etap14) |
| `fulfilled_at` | timestamptz | (etap14) |

Індекси по `player_id` і по `fulfilled`. Списання балансу також журналюється в `point_log` з `reason='purchase'`. `etap14` беклфілнув усі наявні рядки в `fulfilled=true`.

### Чек-лист підготовки до гри

#### `chore_templates` — каталог пунктів (`supabase/etap13.sql:13`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `kind` | text NN | `'action'` \| `'gear'` |
| `label` | text NN | |
| `note` | text | |
| `sort_order` | int NN d0 | |
| `active` | boolean NN d true | |
| `created_at` | timestamptz | |

Редагований каталог (`/admin/chores`); сід 12 пунктів за замовчуванням.

#### `chore_runs` — один інстанс на гру (`supabase/etap13.sql:23`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `game_id` | bigint NN UNIQUE FK→`games` CASCADE | |
| `chat_id` / `thread_id` / `message_id` | bigint | |
| `status` | text NN d'open' | `open\|reported` |
| `report_at` | timestamptz NN | пт 22:00 (Europe/Warsaw) перед грою |
| `posted_at` | timestamptz d now() | |
| `reported_at` | timestamptz | |

Індекс по `(status, report_at)`.

#### `chore_run_items` — пункти конкретного run (знімок) (`supabase/etap13.sql:37`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `run_id` | bigint NN FK→`chore_runs` CASCADE | |
| `kind` | text NN | |
| `label` | text NN | знімок тексту з шаблону |
| `note` | text | знімок опису з шаблону |
| `sort_order` | int NN d0 | |
| `claimed_tg_id` | bigint | null = вільно (single-claim) |
| `claimed_name` | text | |
| `claimed_at` | timestamptz | |

Індекс по `run_id`. `chore_run_items` — це **знімок** `chore_templates` на момент анонсу гри; один пункт = одна людина.

### Галерея та допоміжні

#### `gallery_media` — фото (`supabase/etap15.sql:8`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `storage_path` | text NN | шлях у bucket: `photos/<uuid>.<ext>` |
| `public_url` | text NN | публічний CDN-URL зі Storage |
| `caption` | text | |
| `file_size` | int | |
| `status` | text NN d'visible' | `visible\|hidden` |
| `uploaded_by` | bigint FK→`players` ON DELETE SET NULL | |
| `created_at` | timestamptz | |

Індекси по `status` і `created_at`. Фото — у публічному Supabase Storage-bucket `gallery` (settings `gallery_bucket='gallery'`, `gallery_display_limit='24'`); `/gallery` показує випадкову вибірку `status='visible'`.

#### `bug_reports` — звіти про помилки сайту (`supabase/etap9.sql:6`)

| Колонка | Тип | Примітки |
|---|---|---|
| `id` | bigint identity PK | |
| `description` | text NN | |
| `email` / `ip` / `url` / `lang` / `user_agent` | text | |
| `meta` | jsonb | |
| `has_screenshot` | boolean NN d false | |
| `created_at` | timestamptz | |

Індекси по `created_at` і `(ip, created_at)` (rate-limit 5/год на IP).

## Підводні камені / важливо

- **Немає DB-рівневих enum/CHECK.** Кожен «enum» (статус гри, статус реєстрації, `point_log.reason`, `identities.provider`, `pyro`/`fire_mode` тощо) — звичайна `text`-колонка; допустимі значення документовані лише в inline-коментарях і контролюються виключно в коді застосунку. БД не валідує ці значення взагалі.
- **RLS вимкнено** і немає FK/CHECK на статусах — база повністю довіряє рівню коду і щодо авторизації, і щодо коректності даних. Хто має доступ — визначає конфіг Supabase-ключів (anon/service), поза цими файлами.
- **Ролі/права не реляційні** — денормалізовані на `players` (`is_admin`, `is_master`, `admin_perms text[]`). Рядки дозволів (`games|rental|checkin|referrals|players|joins`) — вільні елементи масиву без довідника; одруківки БД не зловить. Майстер-адмін бутстрапиться за username через `settings.master_username='delltex'`.
- **Сесій тут немає.** «identities/sessions» з постановки реально мапиться на `identities` + `link_codes`; auth-сесії/користувачі — у керованому Supabase `auth.users` (на нього посилається `identities.external_id` для `email`), поза цими SQL.
- **`etap19` — деструктивна міграція:** дропає `locations.pyro_note` після копіювання в `pyro_note_pl/uk`. У заголовку явно: деплой коду має йти **разом** із міграцією; запуск `etap19` на старому білді (який ще читає `pyro_note`) зламає анонси. Це єдиний `DROP COLUMN` у всьому наборі — решта міграцій суто адитивні.
- **Кілька FK навмисно `ON DELETE SET NULL`** (`point_log.game_id`, `player_achievements.game_id`, `patch_requests.decided_by`, `referrals.game_id`, `purchases.item_id`, `season_runs.winner_id`, `gallery_media.uploaded_by`) — щоб історичні/журнальні рядки переживали видалення гри/гравця/товару. Тому ці колонки можуть бути NULL, навіть якщо рядок представляє реальну минулу подію.
- **`registrations` і `checkins` незалежні** (обидві `unique(game_id, player_id)`); «зіграна гра» (+1) — бізнес-комбінація реєстрації AND чек-іну, що рахується в коді, а не одним рядком чи тригером. `players.games_played` веде застосунок.
- **`settings` — єдиний нетипізований text key/value-store:** числові параметри (`no_patch_multiplier='0.85'`, `pts_attend='10'`) і булеві (`feature_* = 'true'`) зберігаються й парсяться як рядки. `patch_price_zl` сідиться порожнім (`''`) — навмисна заглушка для майстер-адміна.
- **Консолідованого snapshot-файлу немає.** Схему можна відновити лише читанням усіх 21 файлів у числовому порядку (нерівномірна послідовність `schema → 2 → 2b → 3 → 4 → 5 → 5b → 5c → 6 … → 19`); пізніші файли мутують ранні таблиці (`games` у `etap2/2b/5`; `locations` у `etap2/12/18/19`; `purchases` у `etap7/14`), тож будь-який один файл дає неповну картину.
