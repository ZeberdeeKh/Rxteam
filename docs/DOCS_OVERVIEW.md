# DOCS_OVERVIEW — Огляд системи

Цей документ — точка входу в технічну документацію RX Team: спільноти страйкболу (ASG) з Вроцлава. Він пояснює, як між собою з'єднані чотири частини — сайт на **Next.js 14 (App Router)**, **Telegram-бот на grammY**, база/auth **Supabase (PostgreSQL)** і хостинг **Vercel** — і як крізь них проходять запити (публічне читання через SSR, мутації через Server Actions / Route Handlers, бот через webhook, крони від Vercel). Він також фіксує модель деплою (commit-to-main) і слугує змістом (table of contents) для решти `DOCS_*` файлів.

## Зміст документації

| Документ | Про що |
|----------|--------|
| **DOCS_OVERVIEW.md** (цей файл) | Карта системи, потоки запитів, модель деплою, зміст |
| **DOCS_FRONTEND.md** | Next.js App Router, серверні компоненти, `lib/*-data.ts`, i18n, тема, design-system |
| **DOCS_BACKEND.md** | Server Actions та Route Handlers (`app/*/actions.ts`, `app/api/*`), крони, бізнес-логіка `lib/` |
| **DOCS_BOT.md** | grammY-бот (`lib/bot.ts`), webhook, captcha-щит, GPS check-in, прив'язка акаунтів |
| **DOCS_DATABASE.md** | Схема PostgreSQL, 24 таблиці, additive-міграції `supabase/etap*.sql`, RLS OFF |
| **DOCS_AUTH.md** | Подвійна авторизація (Supabase email + TG HMAC-cookie), `getSessionContext`, права адмінів |
| **design-system/README.md** | Дизайн-токени, компоненти `components/ui/`, патерни |
| **architecture/adr/README.md** | Архітектурні рішення (ADR) |

## Технологічний стек

| Шар | Технологія | Версія / джерело |
|-----|------------|------------------|
| Фреймворк | Next.js (App Router) | `^14.2.15` (`package.json`) |
| UI | React + Tailwind CSS | React `^18.3.1`, Tailwind `^3.4.19` |
| Бот | grammY | `^1.30.0` |
| База даних + Auth | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | js `^2.45.4`, ssr `^0.12.0` |
| Дати / часові зони | Luxon | `^3.7.2` |
| Хостинг | Vercel (serverless) | commit-to-main → deploy |
| Мова | TypeScript | `^5.6.2` |

## Карта компонентів (high-level)

```
                            ┌─────────────────────────────────────────────┐
   Браузер користувача      │                  VERCEL                      │
   ───────────────────      │  ┌───────────────────────────────────────┐  │
   GET сторінок ───────────►│  │  Next.js App Router (app/)            │  │
   (public/cabinet/shop)    │  │  • Server Components (async, await)    │  │
                            │  │  • "use client" віджети (Theme/Lang/  │  │
   POST форми ─────────────►│  │    BugReport/GalleryGrid)             │  │
   (Server Actions) ────────│─►│  • middleware.ts (refresh email-сесії)│  │
                            │  └───────────────┬───────────────────────┘  │
                            │                  │ import @/lib/*            │
                            │  ┌───────────────▼───────────────────────┐  │
   Telegram ───webhook────► │  │  Route Handlers (app/api/*)           │  │
   /api/bot (POST)          │  │  • /api/bot  → grammY webhookCallback  │  │
                            │  │  • /api/bug-report (public)           │  │
   Vercel Cron ──GET──────► │  │  • /api/admin/gallery/upload          │  │
   /api/cron/{cleanup,      │  │  • /api/cron/{cleanup,noshow,reminders}│ │
    noshow}                 │  └───────────────┬───────────────────────┘  │
                            │                  │                          │
   зовн. pinger ─GET──────► │     спільний шар  ▼ lib/                     │
   /api/cron/reminders      │  ┌───────────────────────────────────────┐  │
   (Bearer CRON_SECRET)     │  │  lib/* — data-access + бізнес-логіка   │  │
                            │  │  economy/games/checkins/referrals…     │  │
                            │  │  site-data/admin-data/settings/players │  │
                            │  └───────────────┬───────────────────────┘  │
                            └──────────────────┼──────────────────────────┘
                                               │ supabase-js (service key)
                                               ▼
                            ┌─────────────────────────────────────────────┐
                            │  SUPABASE                                   │
                            │  • PostgreSQL (24 таблиці, RLS OFF)         │
                            │  • Auth (email+password, auth.users)        │
                            │  • Storage (gallery-медіа)                  │
                            └─────────────────────────────────────────────┘
```

Ключова ідея архітектури: **`lib/` — єдиний спільний шар** і для сайту, і для бота. Один і той самий `players.ensurePlayer`, `identities.createLinkCode/redeemLinkCode`, `settings.getAllSettings/featureEnabled`, `referrals.confirmReferralCore` викликаються **і з `lib/bot.ts`, і з серверних дій сайту** — бізнес-читання/записи визначені один раз і перевикористовуються. Деталі шару даних — у DOCS_BACKEND.md та DOCS_DATABASE.md.

## Три клієнти Supabase

| Клієнт | Файл | Призначення |
|--------|------|-------------|
| Service-key (привілейований) | `lib/supabase.ts` | **Усі** читання/записи таблиць; обходить RLS; server-only. Єдиний клієнт для доступу до даних. |
| SSR auth (cookie) | `lib/supabase-server.ts` | Лише auth: `getAuthUser()`, керування cookie-сесією; **не** для доступу до таблиць |
| Browser auth | `lib/supabase-browser.ts` | `"use client"` auth у браузері (`signUp`/`signIn`/`verifyOtp`); лише auth |

Правило «доступ до БД тільки через `lib/*`» на практиці означає: будь-який `.from(...)` імпортує спільний `supabase` з `@/lib/supabase` (його використовують і `app/*/actions.ts`, і `app/api/cron/*`), а не створює власний клієнт. Авторизація живе **у коді** (адмін-гейти, резолвери сесії), а **не в базі** — див. DOCS_AUTH.md.

## Потоки запитів

### 1. Публічне читання (SSR)
Майже кожна сторінка в `app/` — це **async Server Component**, що фетчить дані напряму через `await` на `lib/site-data.ts` / `lib/admin-data.ts` (які зсередини викликають service-key supabase). Інтерактивними `"use client"` залишаються лише дрібні віджети.

- Приклад: `app/page.tsx` (лендинг) робить `Promise.all` над `getNextGame` / `getRanking` / `getAllSettings` / `getGalleryPhotos`.
- Динамічні/авторизовані сторінки не мають `loading.tsx`/`error.tsx`/`Suspense`; натомість оголошують `export const dynamic = "force-dynamic"` (наприклад `app/games/page.tsx`, `app/cabinet/page.tsx`, `app/shop/page.tsx`).
- Кореневий `app/layout.tsx` — єдиний shell: резолвить мову (`getServerLang`) і сесію (`getSessionContext` → anon/unlinked/linked), малює навігацію (login vs shop/cabinet/logout + Admin-лінк за `isAdmin`), монтує `BugReport`/`ThemeToggle`/`LangSwitcher`.

Детальніше — DOCS_FRONTEND.md.

### 2. Мутації (Server Actions / Route Handlers)
Форм-мутації — це `"use server"` Server Actions в `app/{admin,auth,cabinet,shop}/actions.ts`. Вони ходять напряму через service-role `supabase` (RLS немає — авторизація лише в коді):

- **Адмін-дії** гейтяться через `requirePerm` / `requireMaster` з `lib/admin.ts` (при відмові — `notFound()` / 404).
- **Cabinet / shop** гейтяться по сесійному гравцю (`getSessionPlayer`, інакше redirect на `/login`).
- Патерн після мутації: `revalidatePath()` → `redirect()` на URL зі статус-параметром (`?saved=1` / `?created=1` / `?err=...`).

Route Handlers (`app/api/*`): grammY webhook, публічний bug-report (feature-flag + IP rate-limit), gallery-upload (gallery-perm, повертає 403/JSON), і три cron-GET. Детальніше — DOCS_BACKEND.md.

### 3. Бот через webhook
Telegram надсилає update'и на `POST /api/bot/route.ts`, який — це лише `webhookCallback(bot, "std/http", { secretToken: WEBHOOK_SECRET })`. Уся логіка бота — в `lib/bot.ts` (команди, captcha-щит, GPS check-in, прив'язка сайту). Бот і сайт ділять `lib/`. Детальніше — DOCS_BOT.md.

### 4. Крони (Vercel + зовнішній pinger)

| Маршрут | Розклад | Джерело розкладу | Призначення |
|---------|---------|------------------|-------------|
| `/api/cron/cleanup` | `0 3 * * *` | `vercel.json` | відхиляє протерміновані `join_challenges` через бот |
| `/api/cron/noshow` | `0 22 * * *` | `vercel.json` | помічає зареєстрованих без check-in як `no_show` + штраф балами |
| `/api/cron/reminders` | кожні ~15 хв | **зовнішній pinger** (cron-job.org) | звіти по chores + нагадування про гру (day / -2h) |

Усі три cron-GET захищені `Authorization: Bearer CRON_SECRET`. У `vercel.json` заплановані **лише** `cleanup` і `noshow`; `reminders` реалізований, але навмисно запускається зовнішнім pinger'ом (бо Vercel Hobby-крони працюють раз на добу, а обидва слоти вже зайняті).

## Сесія та три стани користувача

`getSessionContext()` (`lib/session-player.ts`) — єдиний резолвер, що зводить обидві системи авторизації у три стани:

| Стан | Що означає |
|------|------------|
| `anon` | немає сесії |
| `unlinked` | є Supabase-email user, але немає `players`-профілю |
| `linked` | є реальний рядок `players` — через TG-cookie **або** через email-identity |

Спершу перевіряється власна TG-сесія (`rx_tg_session` cookie), потім email-сесія Supabase (`session-player.ts:21-38`). Повний опис подвійної авторизації, прав (`is_master` / `is_admin` / `admin_perms[]`) і гейтів — у DOCS_AUTH.md.

## Модель деплою (commit-to-main)

Розробка йде **напряму на prod**: commit у `main` = деплой на Vercel. Vercel збирає Next.js (`next build`), піднімає serverless-функції для Route Handlers і реєструє Vercel-крони з `vercel.json`. База і auth — у Supabase (керований сервіс).

Окремий ланцюжок — **схема БД**: 20 пронумерованих additive-міграцій `supabase/etap*.sql` запускаються **вручну** в Supabase SQL Editor у правильному порядку (`schema → 2 → 2b → 3 → 4 → 5 → 5b → 5c → 6 … 19`). Вони не виконуються Vercel'ом і не входять у деплой коду (за винятком `etap19`, чий заголовок вимагає одночасного деплою коду й міграції — це єдиний `DROP COLUMN`). Деталі — DOCS_DATABASE.md.

Webhook бота встановлюється окремим скриптом `scripts/set-webhook.ts` (`npm run set-webhook`), а не автоматично при деплої.

## Підводні камені / важливо

- **RLS вимкнено повністю.** Жоден `supabase/*.sql` не вмикає Row Level Security і не описує політик. Service-key клієнт (`lib/supabase.ts`) обходить RLS. Уся авторизація — у коді (адмін-гейти в викликачах, резолвери сесії), база їй довіряє цілком. Забутий `requirePerm` / `getSessionPlayer` на будь-якій дії = необмежений запис у БД.
- **Подвійна авторизація.** Email-сесія Supabase (оновлюється в `middleware.ts`) і власна TG-cookie (`rx_tg_session`) живуть паралельно; у `getSessionContext` TG-cookie перевіряється **першою** і перемагає, якщо існують обидві.
- **`reminders` може не спрацьовувати в проді.** Він не в `vercel.json` — лише зовнішній pinger. Якщо зовнішнє завдання (cron-job.org) не налаштоване, нагадування не йдуть.
- **CRON_SECRET-гейт умовний:** `if (process.env.CRON_SECRET && auth !== ...)`. Якщо `CRON_SECRET` не заданий у середовищі — усі три cron-GET відкриті й публічно викликаються.
- **Немає loading/error/Suspense UX.** У `app/` немає жодного `loading.tsx`/`error.tsx`/`not-found.tsx` і `<Suspense>`. Повільний фетч на `force-dynamic` блокує весь маршрут без скелета; помилки спливають на дефолтну сторінку Next.
- **Дві паралельні реалізації check-in.** Спільний `lib/checkins.ts` (web/manual) і вбудований `handleCheckin` у `lib/bot.ts` дублюють логіку нарахування/ачивок/рефералів — зміну в одному треба дзеркалити в іншому.
- **«Сезонного» скидання балів немає.** `lib/season.ts` лише рахує межі кварталу; `points_earned` монотонно зростає, нічого не обнуляє баланс. Квартальна подія — лише ручна лотерея `/lottery`.
- **Адмін-гейтинг дубльований.** Layout робить грубий «будь-який адмін» гейт, але кожна сторінка/дія мусить **самостійно** викликати `requirePerm`/`requireMaster`. Нова адмін-сторінка без власного гейта буде доступна будь-якому адміну.
- **Дефолтна мова — `uk`** (українська), коли немає cookie й `Accept-Language` не збігається з pl/en (`lib/site-i18n.ts`), попри те що спільнота базована у Вроцлаві/Польщі.
- **Типографіка TMS Delltex (7 рівнів) не діє тут.** RX Team — окремий проєкт з власним дизайн-стандартом (Montserrat, свої рівні) — див. design-system/README.md. Глобальні правила CLAUDE.md з TMS до цього репозиторію **не застосовуються**.
- **Розбіжність у документації кнопок:** design-system/README.md і «ADR-0026» згадують три види кнопок (action/delete/ghost), але `components/ui/buttons.ts` реалізує лише два (`action`/`delete`); `ghost` у коді відсутній.
