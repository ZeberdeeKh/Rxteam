# DOCS_BACKEND — Бекенд (сервер)

Документ описує серверну частину RX Team: шар доступу до даних `lib/*`, три клієнти Supabase, доменну/бізнес-логіку (економіка/бали/надійність, життєвий цикл ігор, чек-іни, реферали, сезон), а також усі Server Actions (мутації) і Route Handlers (галерея, баг-репорт, крони). Ключове правило: **доступ до БД — лише через `lib/*`** (через спільний service-key клієнт). Ті самі хелпери `lib/*` обслуговують одночасно сайт (Next.js) і Telegram-бота (grammY), тож бізнес-читання/записи визначені один раз і перевикористовуються.

Суміжні документи: `DOCS_OVERVIEW.md`, `DOCS_FRONTEND.md`, `DOCS_BOT.md`, `DOCS_DATABASE.md`, `DOCS_AUTH.md`. Дизайн-система — `design-system/README.md`, рішення — `architecture/adr/README.md`.

---

## 1. Три клієнти Supabase

| Файл | Експорт | Ключ / env | Роль |
|------|---------|-----------|------|
| `lib/supabase.ts` | `supabase` | `SUPABASE_URL` / `SUPABASE_SECRET_KEY` (`lib/supabase.ts:3-4`) | Service-key клієнт, **обходить RLS**, лише сервер. ЄДИНИЙ клієнт для ВСІХ читань/записів таблиць (`lib/supabase.ts:8-10`). |
| `lib/supabase-server.ts` | `createClient` / `getAuthUser` / `isAuthConfigured` | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`lib/supabase-server.ts:14-15`) | SSR auth-клієнт на cookies запиту (`createServerClient`); `getAuthUser()` повертає поточного email-користувача або `null` (`lib/supabase-server.ts:37-48`). **Лише auth, без `.from()`**. |
| `lib/supabase-browser.ts` | `createClient` | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`lib/supabase-browser.ts:9-10`) | `"use client"` browser auth-клієнт (`createBrowserClient`, publishable key, cookie-сесія). **Лише auth**. |

Розділення ключів суворе: service-key клієнт ніколи не потрапляє в браузер (`lib/supabase.ts:6-7`), коментар у `lib/supabase-browser.ts:6` застерігає не плутати ключі. Service-key клієнт створюється з `{ auth: { persistSession:false, autoRefreshToken:false } }` (`lib/supabase.ts:8-10`). Деталі сесій/auth — у `DOCS_AUTH.md`.

### Правило «доступ до БД лише через `lib/*`»

На практиці це означає: **усі запити таблиць (`.from(...)`) ідуть через спільний клієнт, імпортований з `@/lib/supabase`**, а не через самостійно створений клієнт:

- `app/admin/actions.ts:5`, `app/cabinet/actions.ts:8`, `app/api/cron/reminders/route.ts:1` — `import { supabase } from "@/lib/supabase"`.
- Єдине використання `createClient` поза `lib/supabase*.ts` — auth-only SSR клієнти: `app/auth/actions.ts` (`supabase.auth.signUp/signInWithPassword/signOut`), `app/auth/confirm/route.ts` (`auth.verifyOtp/exchangeCodeForSession`), `middleware.ts` (інлайн `createServerClient` для оновлення сесії `auth.getUser`).

> ⚠️ Правило — це «весь доступ до таблиць через service-key клієнт», а **не** «усі записи загорнуті в хелпери `lib/*`». Server Actions у `app/*/actions.ts` і крон-роути викликають `supabase.from(...)` напряму, але після імпорту спільного клієнта. Тобто частина мутацій живе в `app/*/actions.ts`, а не в `lib/`.

---

## 2. Шар читання даних `lib/*`

### `lib/site-data.ts` — публічне читання (лендінг, /games, кабінет, шоп, галерея)

Працює лише через service-key клієнт (без `next/headers`). Читає таблиці `games`, `registrations`, `checkins`, `players`, `point_log`, `shop_items`, `gallery_media`, `player_achievements`.

| Функція | Рядок | Призначення |
|---------|-------|-------------|
| `getNextGame` | `lib/site-data.ts:119` | Найближча гра (+join `locations`), із кількістю зареєстрованих і налаштуваннями. |
| `getUpcomingGames` | `:135` | Майбутні анонсовані ігри. |
| `getPastGames` | `:153` | Минулі ігри. |
| `getRanking` | `:181` | Топ-N за `points_earned`/`games_played`, **виключає** `is_admin`/`is_master`. |
| `getCabinetGames(playerId)` | `:207` | Ігри з відкритим вікном чек-іну + прапорці гравця (join `registrations`+`checkins`). |
| `getPointLog(playerId,lang,limit)` | `:272` | `point_log`, з резолвом покупок у назви `shop_items` обраною мовою. |
| `getShopItems(activeOnly)` | `:333` | `shop_items` (`activeOnly=true` для вітрини, `false` для адмінки). |
| `getGalleryPhotos(limit)` | `:355` | `gallery_media` (`status='visible'`, перемішування Fisher-Yates у Node). |
| `getPlayerAchievements(playerId)` | `:371` | `player_achievements` (+назви `achievements`). |

`buildAnnouncement` (`lib/site-data.ts:55-84`) **перебудовує текст Telegram-анонсу з рядків БД**, бо Bot API не вміє читати назад текст опублікованого повідомлення.

### `lib/admin-data.ts` — адмінське читання (read-only, гейт у викликачах)

Усі функції read-only; авторизація — на стороні викликача (коментар `lib/admin-data.ts:4`).

| Функція | Рядок | Призначення |
|---------|-------|-------------|
| `listGamesAdmin` | `:18` | Список ігор з лічильниками reg/checkin. |
| `getGameDetail` | `:76` | Деталь гри + рядки реєстрацій (join `registrations`, `checkins`, `players`, `locations`). |
| `listPlayers` | `:139` | Гравці. |
| `listReferrals` | `:158` | Реферали (імена з `players`). |
| `listRentalRequests` | `:194` | Заявки на прокат (`registrations.needs_rental`). |
| `listJoinChallenges` | `:224` | `join_challenges`. |
| `listLocations` / `listLocationsFull` | `:233` / `:277` | Локації (+`gameCount`). |
| `listChoreTemplates` | `:251` | `chore_templates`. |
| `listShopItemsAdmin` | `:311-313` | Делегує `getShopItems(false)` з `site-data`. |
| `listGalleryMedia` | `:325` | Список галереї для модерації. |
| `listPurchasesAdmin` | `:346` | Журнал покупок. |

### Інші модулі `lib/*`

| Модуль | DB? | Призначення |
|--------|-----|-------------|
| `lib/settings.ts` | так (`settings`) | Key/value конфіг: `getSetting`, `setSetting` (upsert `onConflict:"key"`), `featureEnabled`, `getAllSettings`. Спільний для бота, сайту, кронів, адмін-екшенів. |
| `lib/players.ts` | так (`players`) | `ensurePlayer` (find/create + bootstrap майстра), `setPlayerLang`, `getPlayerByTg`, `getTopPlayers`, `getAdminsWithPerm`, `getPlayerRank`. Спільний бот+сайт. |
| `lib/identities.ts` | так (`identities`,`link_codes`) | Прив'язка TG-профілю до email-юзера: `createLinkCode` (бот), `redeemLinkCode` (кабінет), `getPlayerIdByAuthUser` (резолвер сесії сайту). |
| `lib/members.ts` | так (`group_members`) | `recordMemberSeen`, `recordMemberLeft`, `hasEverLeft`. **Лише бот.** |
| `lib/state.ts` | так (`user_states`) | FSM діалогу бота в БД (serverless): `getState`, `setState` (upsert), `clearState`. **Лише бот.** |
| `lib/social.ts` | **ні** (чистий конфіг) | `SOCIALS` + `resolveSocials(settings)` (приймає лише http(s)). Сайт + адмінка. |
| `lib/replicas.ts` | **ні** (чистий конфіг) | `REPLICA_TYPES`/`REPLICA_CODES`, `PYRO_STATES`, `FIRE_MODES`, `LIMIT_SETTING_DEFAULTS`. Тексти лімітів живуть у `settings`. |
| `lib/session-player.ts` | так (через спільний клієнт) | `getSessionContext()` резолвить anon/unlinked/linked з TG-cookie або Supabase email-auth. |

### Спільне використання бот + сайт

| Хелпер | Бот | Сайт |
|--------|-----|------|
| `players.ensurePlayer` | `lib/bot.ts:206` (~50 викликів) | `app/auth/telegram/route.ts:20` |
| `identities.createLinkCode` | `lib/bot.ts:37,250` | — |
| `identities.redeemLinkCode` | — | `app/cabinet/actions.ts:7,34` |
| `identities.getPlayerIdByAuthUser` | — | `lib/session-player.ts:4,32` |
| `settings.getAllSettings` | `lib/bot.ts:14` | `lib/site-data.ts:130,145,163` |
| `referrals.confirmReferralCore` | бот | `lib/checkins.ts` (web-чек-ін) |

`createStandalonePlayerForSession` (`lib/site-player.ts:22-40`) дає email-юзеру створити гравця **без `tg_user_id`** (рішення 2026-06-15, коментар `lib/site-player.ts:6`). Деталі бота — у `DOCS_BOT.md`.

---

## 3. Бізнес-логіка (домен)

Доменний шар керує економікою-гейміфікацією ASG-спільноти: бали за явку (geo/ручний чек-ін), витрати в шопі та на звання, ачівки, статистика надійності. Майже кожен тюнабл читається з `settings` із хардкод-fallback у коді. **Per-season обнулення балів НЕМАЄ**: `points_earned` лише зростає, «сезон» — це лише вікно дат.

### `lib/economy.ts` — рушій балів

`awardPoints(opts)` (`lib/economy.ts:47`):
- Повертає 0, якщо фіча `economy` вимкнена (`:48`) або обчислений delta = 0 (`:66`).
- Множник `no_patch_multiplier` (дефолт 0.85) застосовується **лише до додатних delta** (заробіток) без патча; штрафи (`delta<0`) ніколи не множаться (`:51,61-63`). Заробіток `Math.round`-иться.
- `points_earned` — lifetime, лише вгору (додає delta тільки при `delta>0`, `:81`); `points_balance` — гаманець, `Math.max(0, ...)` (`:82`). Кожна зміна пишеться в `point_log` (`:68`).

| Сутність | Рядок | Деталь |
|----------|-------|--------|
| `RANKS` | `:5` | `Recruit → Scout → Squad Leader → Team Leader`. |
| `RANK_COST_KEY` / `RANK_COST_FALLBACK` | `:9` / `:16` | `rank_cost_scout` 100, `rank_cost_squad` 250, `rank_cost_team` 500. |
| `getPointValue(key,fallback)` | `:23` | Числове налаштування зі знаком + fallback. |
| `nextRank(current)` | `:30` | Наступне звання або `null` на максимумі. |
| `grantAchievement(...)` | `:107` | Ідемпотентна видача (unique-гард `:130`); tier-бали: easy=`pts_ach_easy` 5, hard=`pts_ach_hard` 20, інакше mid=`pts_ach_mid` 10 (`:99-102`). |
| `grantCheckinAchievements(...)` | `:151` | `first_contact` (≥1), `deploy_10/25/50`, `dawn_patrol` коли `earlyMinutes ∈ [0,10]` (`:163-167`). |
| `getReliability(playerId)` | `:174` | `pct = round(attended/(attended+noShow)*100)`; `attended` = к-сть рядків `checkins`, `noShow` = к-сть `registrations.status='no_show'`; `null` коли total=0 (`:189`). All-time. |

### `lib/games.ts` — час/гео ігор

| Функція | Рядок | Деталь |
|---------|-------|--------|
| `computeWindows(gather,start)` | `:34` | `reg_closes_at=g-9h`, `cancel_deadline=g-24h`, `checkin_from=g-30m`, `checkin_to=s+60m` (`:38-41`). Зберігаються на рядку гри при створенні. |
| `formatGameWhen(utcIso,locale)` | `:54` | `'ccc, dd.MM.yyyy, HH:mm'` у Europe/Warsaw. |
| `distanceMeters(...)` | `:62` | Haversine для радіуса гео-чек-іну. |
| `registeredCount(gameId)` | `:73` | К-сть `registrations.status='registered'`. |
| `buildLimits(lang,g,settings)` | `:120` | Блок power-limit: лише дозволені на локації типи реплік (порядок `REPLICA_TYPES`) з текстом `limit_<code>_<lang>`, рядок піро (`pyro_<state>_<lang>` або `LIMIT_SETTING_DEFAULTS`) + рядок fire-mode. |
| `buildAnnouncement(g,settings)` | `:144` | Двомовний PL/UA анонс, опційний хедер `count/capacity` за фічею `feature_announce_count`. |

### `lib/checkins.ts` — спільне ядро чек-іну

`performCheckin(opts)` (`lib/checkins.ts:7`): вставляє `checkins`, `+1 games_played` (`:36`), нараховує `attend` з `baseDelta=pts_attend` (дефолт 10), видає чек-ін-ачівки, **знімає `no_show`** з реєстрації назад у `registered` (`:55-60`), запускає підтвердження реферала. У бота є **паралельна** інлайн-реалізація `handleCheckin` (`lib/bot.ts:1875`), що дублює award/achievement/referral-логіку (`gamesPlayedAfter` рахується окремо на `:1931`).

### `lib/referrals.ts` — реферали

`confirmReferralCore(invited,gameId,gamesPlayedAfter)` (`lib/referrals.ts:26`) спрацьовує лише коли `gamesPlayedAfter===1` (перша гра новачка): pending→confirmed (`game_id`,`confirmed_at`), нараховує запрошувачу `pts_friend` (дефолт 10), видає `recruiter`, повертає `confirmedCount`. Бот мапить це на знижку: 1 друг → пів ціни, ≥2 → безкоштовно (`lib/bot.ts:746-747`). Створення `bindReferral` (`lib/bot.ts:714`) має анти-абуз: лише новий гравець, не self-referral, фіча `referrals` ON, ніколи не виходив із групи і не є поточним учасником, без наявного referral-рядка, запрошувач має `games_played>=1`.

### `lib/season.ts` — календарний квартал (без обнулення)

`currentQuarter()` (`:17`) / `prevQuarter()` (`:22`) — межі кварталу в Europe/Warsaw, лейбл `'Q<n> <year>'`. Живить `/stats` (`lib/bot.ts:459`) і ручну `/lottery` (`:410`). **Жоден код не обнуляє** `points_balance`/`points_earned` між кварталами.

**Квартальна лотерея надійності** (`/lottery`, admin, фіча `lottery`, `lib/bot.ts:398`): один раз на квартал (`season_runs.quarter` unique; повторний запуск повертає наявного переможця). Eligible — гравці з ≥1 чек-іном і 0 no_show у вікні кварталу; кожен отримує `iron_discipline`, один випадковий — у `season_runs`.

### `lib/chores.ts` — чек-листи підготовки

| Функція | Рядок | Деталь |
|---------|-------|--------|
| `postChoreRun` | `:143` | Гейт фіча `chores`+`chores_chat_id`, ідемпотентний per game; снапшот `chore_templates` → `chore_run_items`. |
| `toggleChoreClaim` | `:230` | Один claim на пункт через умовний апдейт (`claimed_tg_id IS NULL`) — стійко до подвійного кліку. |
| `computeReportAt` | `:44` | Пт 22:00 ISO-тижня гри; fallback `start-2h`/`start` для пізніх анонсів. |
| `processDueChoreReports` | `:303` | Постить звіт, заморожує клавіатуру, ставить `reported`. |

### `lib/replicas.ts` — фіксований каталог

`REPLICA_TYPES` (cqb/dmr/sniper/pistol/lmg), `PYRO_STATES` (yes/no/limited), `FIRE_MODES` (auto/semi), `LIMIT_SETTING_DEFAULTS` (`lib/replicas.ts:8-41`). Тексти лімітів — у `settings`; додати нову категорію реплік можна лише зміною коду.

Сидинг дефолтів — `supabase/etap3.sql` (pts_attend 10, pts_noshow −5, pts_friend 10, ach 5/10/20, `no_patch_multiplier` 0.85, rank costs 100/250/500). Схема таблиць — `DOCS_DATABASE.md`.

---

## 4. Server Actions (мутації)

Дві моделі авторизації:
- **Admin**: `requirePerm(perm)` / `requireMaster()` з `lib/admin.ts` → при відмові `notFound()` (рендер 404), при успіху повертають `SitePlayer` (`lib/admin.ts:35-46`).
- **Cabinet/Shop**: `getSessionPlayer()`, при `null` → `redirect('/login')` (`app/cabinet/actions.ts:73-74`).

`AdminPerm`: `games | rental | checkin | referrals | players | joins | gallery` (`lib/admin.ts:5`); майстер має всі права (`hasPerm` → `is_master` true, `lib/admin.ts:19`).

**Стандартний патерн успіху**: `revalidatePath(...)` → `redirect(...)` з прапорцем статусу в URL — `?saved=1`, `?created=1`, `?deleted=1`, `?cancelled=1`, `?adjusted=1`, `?bought=1` тощо. Помилки валідації → `?err=<reason>` (`?err=fields`, `?err=inuse`, `?err=balance`). Хелпери-замикання `back2`/`backChores`/`backShop`/`back`/`backTo` централізують ціль редіректу.

### `app/admin/actions.ts` (474 рядки)

| Дія | Гейт | Рядок | Результат |
|-----|------|-------|-----------|
| `saveSettings` | master | `:20` | `settings` ← TOGGLE/VALUE keys + `SOCIALS` settingKeys → `?saved=1` |
| `createGame` | `games` | `:44` | валідація → UTC-вікна → insert `games` `announced` → `?created=1`/`?err=fields` |
| `cancelGame` | `games` | `:78` | `games.status='cancelled'` + каскад registered→cancelled → `?cancelled=1` |
| `createLocation` | `games` | `:118` | insert `locations` (+`parseLimits`) → `?created=1` |
| `updateLocation` | `games` | `:133` | → `?saved=1`/`?err=fields` |
| `deleteLocation` | `games` | `:150` | блок якщо вжито грою (`?err=inuse`) → `?deleted=1` |
| `createChore` | master | `:173` | insert `chore_templates` → `?created=1` |
| `updateChore` | master | `:186` | → `?saved=1` |
| `deleteChore` | master | `:204` | → `?deleted=1` (снапшот у `chore_run_items` лишається) |
| `manualCheckin` | `checkin` | `:215` | `performCheckin source='manual'` → `?checked=1` |
| `markNoShow` | `checkin` | `:247` | `registrations.status='no_show'` → `?noshow=1` |
| `adjustPoints` | `players` | `:263` | `point_log reason='manual'` + апдейт агрегатів (floor 0) → `?adjusted=1` |
| `setPlayerCallsign` | `players` | `:288` | → `?callsign=1`/`?err=callsign_*` |
| `togglePatch` | `players` | `:296` | флип `has_patch`, при видачі без звання → `rank='Recruit'` → `?patch=1` |
| `makeAdmin` | master | `:313` | `is_admin=true` (skip якщо `is_master`) → `?admin=1` |
| `setReferralStatus` | `referrals` | `:330` | `referrals.status` confirmed/rejected → `?saved=1` |
| `saveRoles` | master | `:348` | `is_admin`+`admin_perms[]` з `ALL_PERMS` (skip master, `?err=master`) → `?saved=1` |
| `createShopItem` | master | `:389` | insert `shop_items` (≥1 заголовок) → `?created=1` |
| `updateShopItem` | master | `:400` | → `?saved=1`/`?err=fields` |
| `deleteShopItem` | master | `:413` | → `?deleted=1` |
| `markFulfilled` | master | `:425` | `purchases.fulfilled=true` → `?fulfilled=1` |
| `toggleGalleryMedia` | `gallery` | `:439` | флип `gallery_media.status` visible↔hidden → `?saved=1` |
| `deleteGalleryMedia` | `gallery` | `:456` | видаляє Storage-файл + рядок → `?saved=1` |

### `app/auth/actions.ts`

`signUp`/`signIn` — сигнатура `useActionState`: `(_prev: AuthState, formData) → AuthState ({error?})` з i18n-ключами, редірект лише при успіху (signUp → `/auth/check-email`, signIn → `/cabinet`). Сирий `error.message` Supabase мапиться у ключі словника (`auth_err_email_taken`, `auth_err_rate_limit`, `auth_err_bad_creds`, `auth_err_not_confirmed`, `auth_err_generic`), щоб не лити англ. текст у pl/en/uk UI (`app/auth/actions.ts:33-40`). `signUp` вимагає `password.length >= 8` (інакше ключ `auth_min_pass`, `:23`). `signOut` (`:65`): умовний `auth.signOut()` лише якщо `isAuthConfigured()` (try/catch), потім завжди видаляє `TG_SESSION_COOKIE` і редірект на `/` (двосесійна модель — деталі в `DOCS_AUTH.md`).

### `app/cabinet/actions.ts`

| Дія | Рядок | Деталь |
|-----|-------|--------|
| `linkTelegram` | `:27` | `(prev,formData)→LinkState`; вимагає auth-юзера (`/login`), фіча `site_link`; `redeemLinkCode`; reason→`link_err_*`; успіх → `/cabinet?linked=1`. |
| `createStandalone` | `:54` | `createStandalonePlayerForSession`; fail → `''`(anon)/`?err=generic`; успіх → `?welcome=1`. |
| `saveCallsign` | `:62` | сесія (`/login`); `setCallsignForPlayer`; `?callsign=1`/`?err=callsign_*`. |
| `registerForGame` | `:72` | вимагає `player.callsign` (`?err=need_callsign`), `status==='announced'`, `now<reg_closes_at` (`?err=reg_closed`), capacity через `registeredCount` (`?err=game_full`); upsert `registrations` `onConflict(game_id,player_id)`; `?reg=1`. |
| `unregisterFromGame` | `:110` | блок після `cancel_deadline` (`?err=cancel_locked`); інакше `status='cancelled'` → `?unreg=1`. |
| `webCheckin` | `:132` | гео + вікно: валідація lat/lng, `[checkin_from,checkin_to]` (`?err=checkin_window`), реєстрація `registered`/`no_show` (`?err=not_registered`), `distanceMeters`≤`radius_m` (`?err=too_far`), дедуп (`?err=checkin_already`); `performCheckin source:'web'` + `earlyMinutes`. |

Захист від open-redirect: `backTo()` приймає лише `returnTo ∈ {/cabinet,/games}`, інакше дефолт `/cabinet` (`app/cabinet/actions.ts:46-51`).

### `app/shop/actions.ts`

`buyItem` (`:20`): фіча `shop`, сесійний гравець (`/login`), активний товар (`?err=inactive`), `points_balance >= cost` (`?err=balance`); insert `purchases` → `awardPoints reason='purchase' baseDelta=-cost` (штраф → без множника, баланс floor 0); `notifyAdminsPurchase` fire-and-forget (`.catch(()=>{})`) → `?bought=1`.

`buyRank` (`:65`): фіча `shop`+`economy`, потрібен `has_patch` (`?err=rank_need_patch`), `nextRank` (`?err=rank_max`), захист від застарілої форми (`?err=rank_changed`, `:80`), ціна з `getPointValue(RANK_COST_KEY/FALLBACK)`. **Не йде через `awardPoints`** — пише `point_log` + `players.points_balance/rank` напряму (`:87-93`) → `?rank_bought=1`.

---

## 5. Route Handlers (`app/api/*`)

| Маршрут | Метод | Гейт | Опис |
|---------|-------|------|------|
| `/api/bot` | POST | `secretToken=WEBHOOK_SECRET` | grammY `webhookCallback(bot,'std/http')`, перевіряє `X-Telegram-Bot-Api-Secret-Token`; `runtime='nodejs'`, `dynamic='force-dynamic'` (`app/api/bot/route.ts:7-13`). |
| `/api/bug-report` | POST | публічний + фіча | feature `bug_report` (503), опис обовʼязковий (400), скрін >5MB (413), ліміт 5/год на IP (429), insert `bug_reports` → `notifyAdminsBugReport` (best-effort). IP з `x-forwarded-for`(перший хоп)/`x-real-ip`. |
| `/api/admin/gallery/upload` | POST | `hasPerm(player,'gallery')` → 403 JSON | multipart; per-file валідація `image/*`, не порожній, ≤1MB; upload у бакет (`gallery_bucket`, дефолт `gallery`) `photos/<uuid>.<ext>` + insert `gallery_media`; при фейлі insert — видалення orphan-файла; `{ok,created,skipped}`. |
| `/api/cron/cleanup` | GET | Bearer `CRON_SECRET` | відхиляє протерміновані `join_challenges` (`pending`,`expires_at<now`) через `bot.api.declineChatJoinRequest`, ставить `expired`; `{declined:N}`. **vercel.json `0 3 * * *`**. |
| `/api/cron/noshow` | GET | Bearer `CRON_SECRET` | ігри після `checkin_to`: `registered` без `checkins` → `no_show` + `pts_noshow` (per-reg); `{no_show:N}`. **vercel.json `0 22 * * *`**. |
| `/api/cron/reminders` | GET | Bearer `CRON_SECRET` | `processDueChoreReports` (незалежно від фічі), потім якщо `featureEnabled('reminders')` — нагадування за день (`remind_day_hour` 18:00) і за `-2h` (`remind_before_h`); ідемпотентність через `games.reminded_day/reminded_2h`; luxon Europe/Warsaw. **НЕ в vercel.json** — зовнішній пінгер (~15 хв). |

Гейт кронів — умовний: `if (process.env.CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`)` (`app/api/cron/reminders/route.ts:19-22`, так само cleanup/noshow). Деталі команд бота — у `DOCS_BOT.md`.

---

## Підводні камені / важливо

- **Правило `lib/*` ≠ «усі записи в хелперах».** Це «весь доступ до таблиць через service-key клієнт `@/lib/supabase`». Server Actions і крони викликають `supabase.from(...)` напряму (`app/admin/actions.ts`, `app/cabinet/actions.ts`, `app/api/cron/*`), не створюючи власний клієнт. Частина мутацій живе в `app/*/actions.ts`.
- **RLS вимкнено, авторизація лише в коді.** Service-key клієнт обходить RLS (`lib/supabase.ts:6`); функції `admin-data.ts` — незахищені read'и, покладаються на admin-гейт у викликачі (`lib/admin-data.ts:4`). Забутий `requirePerm`/`getSessionPlayer` = необмежені записи в БД.
- **Admin-гейт падає через `notFound()` (404), а не 403/redirect.** Виняток — `gallery/upload` (fetch-API), що віддає 403 JSON.
- **`CRON_SECRET` умовний.** Якщо env не заданий, усі три крон-GET відкриті публічно (cleanup/noshow/reminders).
- **`reminders` не у `vercel.json`** (там лише cleanup `0 3` і noshow `0 22`). Має тригеритись зовнішнім пінгером (cron-job.org, `*/15`, `Authorization: Bearer CRON_SECRET`), бо Vercel Hobby крон ходить раз/добу й обидва слоти зайняті. За `PLAN.md` автостарт пінгера «НЕ налаштований (відкладено)» — у проді reminders можуть не спрацьовувати.
- **Немає `season reset`.** `season.ts` лише рахує вікна кварталу; `points_earned` монотонний (`lib/economy.ts:81`), `points_balance` не обнуляється. Єдина квартальна подія — ручна `/lottery` (`lib/bot.ts:398`), без крону (`vercel.json` без lottery).
- **Два паралельних чек-іни.** Спільний `lib/checkins.ts performCheckin` (web/manual) і інлайн `lib/bot.ts handleCheckin` (`:1875`) дублюють award/achievement/referral-логіку — зміну в одному треба дзеркалити в іншому.
- **Множник 0.85 + `Math.round` тихо змінюють суми** (pts_attend 10 → 9 без патча); немає floor до мінімуму 1, тож дуже малий award × 0.85 може округлитись до 0 і пропуститись (`lib/economy.ts:63,66`).
- **`point_log` може розійтися з балансом.** Штраф при балансі 0 логує відʼємний delta, але баланс лишається 0 через `Math.max(0,...)` (`lib/economy.ts:82`).
- **`awardPoints` не транзакційний** (read-modify-write `points_earned/points_balance`, `:76-86`); одночасні award'и (attend+achievement+referral) можуть гонитись і втрачати апдейти. `buyItem`/`buyRank` теж не атомарні (`app/shop/actions.ts:34-47,87-93`) — лише `?err=rank_changed`-гард для рангу, без DB-локу проти подвійної витрати.
- **Дві гілки витрати балів.** `buyItem` йде через `awardPoints`, `buyRank` пише `point_log`+`players` напряму — легко розійтися.
- **`webCheckin` приймає реєстрацію `no_show`** (`app/cabinet/actions.ts:164`): авто-no_show від крону можна неявно «відкотити» само-чек-іном, якщо вікно ще відкрите.
- **Standalone (email-only) гравець без `tg_user_id`** не може бути referral-bound (звʼязка лише на bot `/start`), а бот-код, ключований на `tg_user_id`, його не побачить (`lib/site-player.ts:6,22-40`).
- **`getReliability` vs `eligibleReliable` рахують «явку» по-різному**: перша — рядки `checkins` (`lib/economy.ts:178`), друга — checked-in мінус no_show-гравці (`lib/bot.ts:387`); можуть розходитись.
- **Вкладені relations Supabase** приходять як масив АБО обʼєкт — хелпери нормалізують `Array.isArray(...) ? x[0] : x` (`lib/site-data.ts:35-37`, `lib/admin-data.ts:38,98`). У новому хелпері пропуск дасть тихі `null`.
- **`getGalleryPhotos`** не робить `ORDER BY random()` (ненадійно через PostgREST) — бере останні 200 visible й перемішує в Node (`lib/site-data.ts:355-367`): це не рівномірна вибірка по всій таблиці.
- **Анонс на сайті може дрейфувати** від реального Telegram-повідомлення: текст реконструюється з БД (`buildAnnouncement`, `lib/site-data.ts:55-84`), бо Bot API не читає назад опублікований текст.
- **`bug-report` без авторизації**, ліміт 5/год keyed на перший `x-forwarded-for` — за проксі/NAT може бути спуфабельним або над-агресивним.
- **`computeReportAt` припускає гру на вихідних** і Пт-перед-нею (`lib/chores.ts:48`); гра в будній день усе одно прив'яже звіт до Пт 22:00 того ж ISO-тижня (fallback `-2h`) — таймінг неявний, не конфігурований.
