# Автентифікація та доступ

Сайт RX Team має **подвійну автентифікацію**: email+пароль через Supabase Auth (з обов'язковим підтвердженням пошти) і вхід через Telegram Login Widget на власній підписаній cookie `rx_tg_session` (Supabase про TG-юзерів нічого не знає). Єдиний серверний резолвер `getSessionContext()` зводить обидва шляхи до трьох станів — `anon`, `unlinked`, `linked`. Авторизація — рольова, на рядку `players`: прапорці `is_master` / `is_admin` плюс масив іменованих прав `admin_perms[]`; кожна сторінка й кожен server action гейтяться хелперами з `lib/admin.ts`, а провал кидає `notFound()` (404). Дотичні документи: DOCS_OVERVIEW.md, DOCS_BACKEND.md, DOCS_BOT.md, DOCS_DATABASE.md; ADR: [ADR-0022 dual-auth](architecture/adr/0022-dual-auth-email-and-telegram.md), [ADR-0021 middleware fail-safe](architecture/adr/0021-middleware-fail-safe-session-refresh.md), [ADR-0017 Supabase лише через lib](architecture/adr/0017-supabase-access-only-via-lib.md), [ADR-0018 RLS off + серверна authz](architecture/adr/0018-rls-off-server-side-authz.md).

## Ключові файли

| Файл | Призначення |
|------|-------------|
| `lib/tg-auth.ts` | Перевірка підпису Telegram Login Widget (`verifyTelegramAuth`) і свіжості (`isAuthFresh`, дефолт 24 год) |
| `lib/tg-session.ts` | Власна підписана TG-сесія: `makeTgSession` / `readTgSession`, cookie `rx_tg_session` (30 днів) |
| `lib/session-player.ts` | `getSessionContext()` — єдиний резолвер `anon` / `unlinked` / `linked` |
| `lib/identities.ts` | Лінк-коди (`createLinkCode` у боті, `redeemLinkCode` на сайті) + `getPlayerIdByAuthUser` |
| `lib/site-player.ts` | `getSessionPlayer()` (linked-only), `createStandalonePlayerForSession()`, тип `SitePlayer` |
| `lib/admin.ts` | Ядро авторизації: `AdminPerm`, `ALL_PERMS`, `hasPerm`, `isAdmin`, `getAdmin`, `requirePerm`, `requireMaster` |
| `lib/admin-nav.ts` | `adminNavLinks()` — єдине джерело пунктів меню адмінки з прапорцем `.show` |
| `lib/players.ts` | `ensurePlayer()` — пошук/створення player за `tg_user_id` + бутстрап майстра |
| `lib/supabase-server.ts` | SSR auth-клієнт (`createClient`), `getAuthUser()`, `isAuthConfigured()` |
| `lib/supabase.ts` | Привілейований service-key клієнт (обходить RLS) для записів |
| `lib/server-lang.ts` | `getServerLang()` — мова UI з cookie + `accept-language` |
| `middleware.ts` | Освіження Supabase-сесії на кожному запиті (fail-safe) + matcher |
| `app/auth/telegram/route.ts` | Callback TG-віджета: перевірка → `ensurePlayer` → cookie → `/cabinet` |
| `app/auth/actions.ts` | Email-дії: `signUp`, `signIn`, `signOut` |
| `app/auth/confirm/route.ts` | Підтвердження email (`verifyOtp` або `exchangeCodeForSession`) |
| `app/cabinet/actions.ts` | `linkTelegram()` — прив'язка email-сесії до TG за кодом |
| `app/admin/layout.tsx` | Шелл адмінки: грубий гейт «будь-який адмін» + меню |
| `app/admin/page.tsx` | `/admin` без контенту — редірект на перший доступний розділ |
| `app/admin/actions.ts` | Усі мутації адмінки під `requireMaster` / `requirePerm` (`saveRoles`, `makeAdmin`) |
| `app/admin/roles/page.tsx` | Майстер-онлі редактор ролей (чекбокси `admin_perms[]`) |
| `components/auth/TelegramLoginButton.tsx` | Клієнтський віджет: вантажить `telegram-widget.js`, шле підписані поля на `/auth/telegram` |

---

## Подвійна автентифікація

### Шлях A — Telegram Login Widget

Кнопка `TelegramLoginButton` вантажить офіційний `telegram-widget.js` і викликає `window.Telegram.Login.auth`; підписані Telegram поля передаються query-параметрами на `/auth/telegram` (`components/auth/TelegramLoginButton.tsx:52-62`). Домен бота має бути заданий у `@BotFather` (`/setdomain`).

Callback `app/auth/telegram/route.ts` (`runtime = "nodejs"`):

1. Збирає всі query-поля в `data`.
2. Перевіряє `BOT_TOKEN` + підпис (`verifyTelegramAuth`) + свіжість (`isAuthFresh(data.auth_date)`) — інакше редірект `/login?error=tg` (`route.ts:16-18`).
3. `ensurePlayer({...})` знаходить/створює player за `tg_user_id`.
4. Ставить cookie `rx_tg_session` і редіректить на `/cabinet?tg=1`.

**Перевірка підпису** (`lib/tg-auth.ts:5-20`): з усіх полів окрім `hash` будується check-string — пари `key=value`, відсортовані за ключем і з'єднані `\n`. Секрет = `sha256(botToken)`, далі `HMAC-SHA256(secret, checkString)` у hex порівнюється з `hash`. Якщо `hash` відсутній — `false`.

**Свіжість** (`lib/tg-auth.ts:23-27`): `isAuthFresh` відкидає `auth_date` старший за `maxAgeSec` (дефолт `86400` с = 24 год) — захист від повтору старого лінка.

**Cookie `rx_tg_session`** (`lib/tg-session.ts`): значення `<playerId>.<exp>.<sig>`, де `sig = HMAC-SHA256(SECRET, "<playerId>.<exp>")` у base64url. `readTgSession` перевіряє підпис і що `exp` не минув — повертає `playerId` або `null` (`tg-session.ts:22-31`). Cookie ставиться `httpOnly`, `secure`, `sameSite: "lax"`, `path: "/"`, `maxAge = 60*60*24*30` (30 днів) (`route.ts:28-34`).

| Атрибут cookie | Значення |
|----------------|----------|
| Ім'я | `rx_tg_session` (`lib/tg-session.ts:8`) |
| Формат | `<playerId>.<exp>.<sig>` |
| Підпис | `HMAC-SHA256` base64url |
| Секрет | `SESSION_SECRET ?? WEBHOOK_SECRET ?? "rx-dev-secret"` (`tg-session.ts:6`) |
| Max-age | 30 днів |
| Прапорці | `httpOnly`, `secure`, `sameSite=lax`, `path=/` |

### Шлях B — Email + пароль (Supabase)

Server actions у `app/auth/actions.ts`:

| Дія | Поведінка |
|-----|-----------|
| `signUp` | `supabase.auth.signUp({ emailRedirectTo: <origin>/auth/confirm })`; мінімум 8 символів пароля; редірект `/auth/check-email` (`actions.ts:20-44`) |
| `signIn` | `signInWithPassword`; на «not confirmed» повертає ключ `auth_err_not_confirmed`; успіх → `/cabinet` (`actions.ts:47-63`) |
| `signOut` | `supabase.auth.signOut()` (якщо налаштовано) **+** видалення cookie `rx_tg_session`; редірект `/` (`actions.ts:65-75`) |

Сирий англомовний текст помилок Supabase **не** віддається в UI — мапиться на ключі словника (`auth_err_email_taken`, `auth_err_rate_limit`, `auth_err_bad_creds`, …) для трилінгви pl/en/uk (`actions.ts:32-40`, `54-59`).

**Підтвердження пошти обов'язкове.** `app/auth/confirm/route.ts` підтримує два формати лінка:

- `token_hash` + `type` → `verifyOtp` (кастомний шаблон листа);
- `code` → `exchangeCodeForSession` (дефолтний PKCE-редірект).

Успіх → `/cabinet?confirmed=1`, будь-який провал → `/login?error=confirm` (`confirm/route.ts:16-24`).

---

## Три стани сесії (`getSessionContext`)

`lib/session-player.ts` — єдиний резолвер для серверкомпонентів. **TG-сесія перевіряється ПЕРШОЮ**, потім email-сесія Supabase.

```
1) readTgSession(rx_tg_session) → playerId → fetchPlayer → linked   (authUserId = "tg:<id>", email = null)
2) getAuthUser() → null                                  → anon
3) getPlayerIdByAuthUser(user.id) → null                 → unlinked  (authUserId, email)
4) playerId → fetchPlayer → linked                       (authUserId, email, player)
```

| Стан | Умова | Форма | Джерело |
|------|-------|-------|---------|
| `anon` | Немає TG-cookie і немає Supabase-юзера | `{ state: "anon" }` | `session-player.ts:30` |
| `unlinked` | Supabase-юзер є, але email-ідентичність не мапиться на player | `{ state, authUserId, email }` | `session-player.ts:33,36` |
| `linked` | Є рядок `players` (через TG-cookie АБО email-ідентичність) | `{ state, authUserId, email, player }` | `session-player.ts:25,38` |

Email→player мапиться через `getPlayerIdByAuthUser` — запит `identities WHERE provider='email' AND external_id=<auth user id>` → `player_id` (`lib/identities.ts:84-92`). Для TG-linked `authUserId` синтезується як `tg:<id>`, `email` = `null`.

`getSessionPlayer()` (`lib/site-player.ts:11-14`) повертає `ctx.player` лише для `linked`, інакше `null` — саме його читають усі гейти адмінки.

---

## Прив'язка email ↔ Telegram

Дозволяє email-юзеру (стан `unlinked`) приєднати свій акаунт до наявного TG-профілю — щоб бали/історія були спільні.

**Бот (генерація коду)** — `createLinkCode(playerId, tgUserId)` (`lib/identities.ts:19-43`):
- upsert verified telegram-ідентичності для player (`onConflict: "provider,external_id"`);
- вставка 6-символьного коду з алфавіту без `0/O/1/I/L`, TTL 15 хв, до 6 спроб на колізії.

**Сайт (погашення коду)** — `redeemLinkCode(rawCode, authUserId)` (`lib/identities.ts:50-81`), викликається з `linkTelegram` (`app/cabinet/actions.ts:27-38`):
- код у верхній регістр, перевірки `not_found` / `used` / `expired`;
- якщо цей auth-user уже прив'язаний до **іншого** player → `taken`;
- upsert email-ідентичності `auth user id → player_id`, позначка коду `used`;
- редірект `/cabinet?linked=1`. **Гейт фіча-прапорцем `site_link`** (`cabinet/actions.ts:31`).

**Standalone-профіль (email без TG).** Рішення організатора (2026-06-15): для `unlinked` email-юзера `createStandalonePlayerForSession()` (`lib/site-player.ts:22-40`) створює рядок `players` (ім'я з local-part email, `lang` із сервера) + email-ідентичність. Для `linked` повертає наявний профіль; для `anon` — помилка.

---

## Модель ролей і прав

Авторизація — на рядку `players`. Ядро в `lib/admin.ts`.

| Елемент | Семантика | Код |
|---------|-----------|-----|
| `is_master` | Усі права; `hasPerm`/`requireMaster` короткозамикають на `true`; рядки майстра захищені від правок | `admin.ts:19,42-45` |
| `is_admin` | Груба/legacy-ознака адміна; входить в `isAdmin()`; ставиться `true`, коли призначено будь-яке право | `admin.ts:25`; `app/admin/actions.ts:363` |
| `admin_perms[]` | Масив іменованих прав на рядку player | `admin.ts:20`; редактор `app/admin/roles/page.tsx` |

**Іменовані права** (`AdminPerm` = `ALL_PERMS`, `lib/admin.ts:5-15`): `games`, `rental`, `checkin`, `referrals`, `players`, `joins`, `gallery`.

```ts
hasPerm(p, perm)  // is_master → true; інакше admin_perms.includes(perm)
isAdmin(p)        // is_master || is_admin || admin_perms.length > 0
```

| Право | Що гейтить |
|-------|------------|
| `games` | `/admin/games`, `/admin/games/[id]`, `/admin/locations` + дії створення/скасування/правки гри |
| `rental` | `/admin/rental` |
| `checkin` | Live чек-ін / no-show + контроли на деталі гри (без власного пункту меню; видно через export) |
| `referrals` | `/admin/referrals` + `setReferralStatus` |
| `players` | `/admin/players` + дії коригування/видачі |
| `joins` | `/admin/joins` |
| `gallery` | `/admin/gallery` + дії галереї |

**Майстер-онлі секції** (під `requireMaster`): `settings`, `social`, `shop`, `roles`, `chores`.

---

## Як гейтяться сторінки і дії

Хелпери `lib/admin.ts` (усі читають сесію через `getSessionPlayer` — лише `linked`):

| Хелпер | Поведінка при провалі |
|--------|------------------------|
| `requirePerm(perm)` | `notFound()` (404), якщо `!hasPerm` (`admin.ts:35-39`) |
| `requireMaster()` | `notFound()` (404), якщо `!is_master` (`admin.ts:42-46`) |
| `getAdmin()` | повертає player лише якщо `isAdmin`, інакше `null` (`admin.ts:29-32`) |

**Шарування (defense in depth):**

1. **Шелл** `app/admin/layout.tsx:11-13` — грубий гейт `getAdmin() → notFound()` для всієї адмінки; меню рендериться з `adminNavLinks(admin, lang).filter(l => l.show)`.
2. **Сторінка/дія** ще раз гейтиться своїм конкретним `requirePerm` / `requireMaster` (напр. `app/admin/games/page.tsx:17`, `app/admin/roles/page.tsx:15`).

**Видимість меню** (`lib/admin-nav.ts:9-28`): `settings`/`social`/`shop`/`roles`/`chores` → `is_master`; `games` і `locations` → право `games`; `players`/`referrals`/`rental`/`joins`/`gallery` → відповідне іменоване право; `export` → будь-яке з `players|games|checkin`.

**`/admin` редірект** (`app/admin/page.tsx:11-23`): сторінка без власного контенту — редіректить на перший пункт `adminNavLinks` з `show=true`; запасний випадок (адмін без жодної доступної секції) показує лише заголовок.

**Запис ролей** (`app/admin/actions.ts`):
- `saveRoles` (`requireMaster`, `:348-367`): відмовляється чіпати рядки майстра (`redirect ?err=master`), далі `is_admin = perms.length > 0`, `admin_perms = <відфільтрований ALL_PERMS масив>`.
- `makeAdmin` (`requireMaster`, `:313-327`): ставить `is_admin = true`, пропускає майстрів — **без** додавання `admin_perms`.

**Бутстрап майстра** (`lib/players.ts:24-48`): при кожному TG-вході `ensurePlayer` порівнює username (case-insensitive) із налаштуванням `master_username` (дефолт `delltex`); збіг → `is_master + is_admin`. На наявному player промотує, якщо ще не майстер.

---

## Middleware і Supabase-клієнти

**`middleware.ts`** — освіжає Supabase-сесію на кожному matched-запиті через `supabase.auth.getUser()` (тригерить ротацію токена). Fail-safe: якщо публічні env (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) відсутні — повертає звичайний `next` без сесії; мережеві/Supabase помилки глушаться, щоб авторизація **ніколи не валила сайт у 500** (`middleware.ts:11,36-40`). Деталі — [ADR-0021](architecture/adr/0021-middleware-fail-safe-session-refresh.md).

```
matcher: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"
```

Виключає `/api` (бот/крони), статику Next (`_next/static`, `_next/image`), `favicon.ico` і будь-який файл із розширенням.

| Клієнт | Файл | Призначення |
|--------|------|-------------|
| SSR auth (cookie-bound) | `lib/supabase-server.ts` | `createClient()` / `getAuthUser()`; `setAll` у `try/catch` (cookies read-only у серверкомпонентах, ротацію бере middleware); повертає `null` на відсутніх env/помилці |
| Service-key (обходить RLS) | `lib/supabase.ts` | `SUPABASE_SECRET_KEY`, `persistSession:false`, `autoRefreshToken:false`; усі записи identities/link-code/player і дії адмінки |

Service-key клієнт використовується лише в серверному коді (route handlers, бот, server actions) — ніколи в браузері. RLS вимкнено (поточний патерн, [ADR-0018](architecture/adr/0018-rls-off-server-side-authz.md)); доступ до Supabase лише через `lib/*` ([ADR-0017](architecture/adr/0017-supabase-access-only-via-lib.md)).

---

## Маршрути та cookie (підсумок)

| Об'єкт | Деталь |
|--------|--------|
| `GET /auth/telegram` | Callback віджета: verify → `ensurePlayer` → cookie → `/cabinet?tg=1`; провал → `/login?error=tg` |
| `GET /auth/confirm` | Підтвердження email (`token_hash+type` або `code`) → `/cabinet?confirmed=1`; провал → `/login?error=confirm` |
| action `signUp` / `signIn` / `signOut` | Email-дії; `signOut` додатково видаляє cookie `rx_tg_session` |
| action `linkTelegram` | Погашення лінк-коду; гейт фіча-прапорцем `site_link` |
| action `createStandalone` | Standalone-профіль для `unlinked` email-юзера |
| cookie `rx_tg_session` | Власна підписана TG-сесія, 30 днів, `httpOnly`/`secure`/`lax` |

---

## Підводні камені / важливо

- **Fallback-секрет TG-cookie.** Якщо немає ні `SESSION_SECRET`, ні `WEBHOOK_SECRET`, секрет = літерал `"rx-dev-secret"` (`lib/tg-session.ts:6`). За такого збігу будь-хто може **підробити `rx_tg_session` для будь-якого `playerId`**. Прод покладається на наявність `WEBHOOK_SECRET`.
- **TG-сесія без серверного стану.** `rx_tg_session` кодує лише `playerId+exp+HMAC`, не прив'язана до Supabase і **не відкликається на сервері**. Витеклий/підроблений валідний cookie приймається до 30 днів; `signOut` лише видаляє cookie на клієнті (`app/auth/actions.ts:73`) — серверного сховища сесій для інвалідації немає.
- **Пріоритет резолвера.** TG-cookie перевіряється **раніше** за email-сесію Supabase (`session-player.ts:21-29`). Якщо є обидві, перемагає TG-linked player, а email-юзер ігнорується — навіть якщо мапиться на іншого player.
- **Authz лише в серверному коді; 404, не 403.** Гейти живуть у серверкомпонентах/діях через `requirePerm`/`requireMaster`, що кидають `notFound()` (404). **Middleware-рівня адмін-гейту немає** — `middleware.ts` лише освіжає сесію, а matcher виключає `/api`, тож API/webhook-маршрути ним **не покриті**.
- **`is_admin` vs `admin_perms[]` розходяться.** `makeAdmin` ставить `is_admin=true` **без** жодного `admin_perms` (`app/admin/actions.ts:323`). Такий player проходить `isAdmin()`/`getAdmin()` (бачить шелл адмінки), але `hasPerm()` хибне для всіх іменованих прав → `/admin` редіректить його **без жодного доступного розділу**.
- **Майстер визначається динамічно.** Статус майстра обчислюється з username проти `master_username` (дефолт `delltex`) при **кожному** TG-вході (`lib/players.ts:24-48`). Зміна налаштування `master_username` або зміна username фактично перепризначає майстра; email-only standalone-player майстром цим шляхом стати **не може**.
- **DB-рівня авторизації немає.** Усі записи identities/link-code/ролей ідуть через service-key клієнт, що обходить RLS (`lib/supabase.ts`), RLS вимкнено — безпека тримається **виключно** на прикладних гейтах ([ADR-0018](architecture/adr/0018-rls-off-server-side-authz.md)).
- **TG-логін «ламається тихо» без `BOT_TOKEN`.** `verifyTelegramAuth` підписує секретом `sha256(BOT_TOKEN)`; якщо `BOT_TOKEN` не заданий — `/auth/telegram` відхиляє всі входи (`/login?error=tg`), тобто fail-safe, але TG-вхід мовчки перестає працювати.
- **Fail-open на відсутніх env.** `getAuthUser` і middleware повертають `null` / звичайний `next` при відсутніх публічних Supabase-env — навмисно, щоб не давати 500, але неправильна конфігурація дає сайт, де **всі anon**, замість явної помилки.
- **`checkin` без пункту меню.** Право `checkin` не має окремого запису в `adminNavLinks`. Player лише з `checkin` має `isAdmin()=true` (непорожній `admin_perms`) і бачить шелл, але єдиний видимий розділ — `export`, плюс контроли чек-іну на деталі гри, яка сама вимагає окремого права `games` для відкриття.
