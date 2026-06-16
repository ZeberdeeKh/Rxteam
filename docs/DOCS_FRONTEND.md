# DOCS_FRONTEND — Фронтенд (сайт)

Сайт RX Team — це Next.js 14 App Router (React 18, Tailwind 3.4), що живе в `app/`. Майже кожна сторінка — асинхронний Server Component, який тягне дані прямо через `await` на функціях `lib/*` (вони звертаються до Supabase на сервері); інтерактив винесено в невеликі `"use client"`-віджети. Цей документ описує структуру маршрутів, модель рендерингу, як дані доходять до сторінок, контекст сесії й гейтинг адмінки в layout, а також i18n у JSX. UI-токени (кнопки, типографіка, кольори, теми) тут **не дублюються** — їх єдине джерело правди в `docs/design-system/README.md`.

Суміжні документи: `DOCS_OVERVIEW.md`, `DOCS_BACKEND.md`, `DOCS_BOT.md`, `DOCS_DATABASE.md`, `DOCS_AUTH.md`. Технічні рішення — в ADR (`docs/architecture/adr/README.md`).

---

## Модель рендерингу

| Аспект | Як зроблено |
|---|---|
| Тип сторінок | Асинхронні Server Components; дані — через `await` на `lib/*` (без клієнтського фетчингу контенту) |
| Завантаження даних | `Promise.all` над функціями `lib/*` — напр. `app/page.tsx:15-20` тягне `getNextGame`/`getRanking`/`getAllSettings`/`getGalleryPhotos` |
| Read-шар | `lib/site-data.ts` (публічні/cabinet/shop), `lib/admin-data.ts` (адмінка) — обидва через service-key Supabase (`lib/supabase.ts`), RLS off |
| Динамічний рендер | Кожна авторизована/динамічна сторінка оголошує `export const dynamic = "force-dynamic"` (всі 17 сторінок адмінки + games/cabinet/shop + усі API/cron-роути) |
| Suspense / loading | **Немає** жодного `loading.tsx`/`error.tsx`/`not-found.tsx` і жодного `<Suspense>` у `app/` |
| Мутації | Лише через server actions, що імпортуються в сторінки/клієнт-форми (`auth/actions`, `cabinet/actions`, `shop/actions`, `admin/actions`) |

Дані доходять до сторінок одним патерном: сторінка резолвить мову (`getServerLang()`) та сесію (`getSessionContext()`), потім `Promise.all` над типізованими читачами з `lib/site-data.ts`, що повертають рядки `SiteGame`, `RankingRow`, `CabinetGame`, `ShopItem`, `GalleryPhoto` тощо.

---

## Повна карта маршрутів

### Публічні / auth

| Маршрут | Файл | Доступ | Нотатки |
|---|---|---|---|
| `/` | `app/page.tsx` | усі | Лендінг: «Про нас» + `GalleryGrid` + найближча гра + топ-10 рейтингу + соцмережі. `Promise.all` над `getNextGame`/`getRanking`/`getAllSettings`/`getGalleryPhotos` |
| `/games` | `app/games/page.tsx` | усі | Найближча + майбутні + минулі ігри через `GameCard`. Linked-гравці з позивним отримують inline `GameActions` (запис/скасування). `force-dynamic` |
| `/cabinet` | `app/cabinet/page.tsx` | auth | Профіль гравця; гілки за станом сесії: `anon`→redirect `/login`, `unlinked`→прив'язка TG / standalone, `linked` без позивного→форма позивного, `linked`→профіль+ачивки+ігри+історія балів. `force-dynamic` |
| `/shop` | `app/shop/page.tsx` | усі (купівля — linked) | Магазин за бали: перки + сходи рангів; гейт фіч-флагами `shop`/`economy`; купівля через server actions. `force-dynamic` |
| `/login` | `app/login/page.tsx` | anon | Email `AuthForm` + кнопка Telegram-логіну (`bot_id` похідний від `BOT_TOKEN` за split на `:`) |
| `/register` | `app/register/page.tsx` | anon | Реєстрація email (`AuthForm mode=register`) |
| `/auth/check-email` | `app/auth/check-email/page.tsx` | усі | Статичний екран «перевір пошту» після email-реєстрації |

### Auth route handlers (GET)

| Маршрут | Файл | Поведінка |
|---|---|---|
| `/auth/confirm` | `app/auth/confirm/route.ts` | Верифікує email OTP `token_hash`+`type` (`verifyOtp`) або `code` (`exchangeCodeForSession`, PKCE) → `/cabinet?confirmed=1` або `/login?error=confirm` |
| `/auth/telegram` | `app/auth/telegram/route.ts` | `runtime nodejs`: верифікує підпис Telegram Login, `ensurePlayer()`, ставить cookie `rx_tg_session` → `/cabinet?tg=1` або `/login?error=tg` |

### Адмінка (`app/admin/*`, усі `force-dynamic`)

Шелл `app/admin/layout.tsx` робить грубий гейт `getAdmin()` → `notFound()`, якщо не адмін; підменю будується з `adminNavLinks` за прапорцями `show`. Кожна сторінка **повторно** гейтиться своїм `requirePerm(...)`/`requireMaster()`.

| Маршрут | Доступ | Що робить |
|---|---|---|
| `/admin` | будь-який адмін | Без власного UI — редірект на перший дозволений розділ (`adminNavLinks`) |
| `/admin/settings` | master | Тумблери фіч/налаштувань |
| `/admin/social` | master | Соцпосилання для лендінгу |
| `/admin/shop` | master | CRUD товарів магазину + лог купівель |
| `/admin/roles` | master | Матриця ролей/прав (`admin_perms[]`) |
| `/admin/chores` | master | Каталог шаблонів prep-чеклістів |
| `/admin/games` | perm `games` | Список / створення ігор |
| `/admin/games/[id]` | perm `games` (check-in — `checkin`) | Деталі гри: реєстрації, ручний check-in / no-show |
| `/admin/locations` | perm `games` | CRUD локацій (репліки/піро/режим вогню) |
| `/admin/players` | perm `players` | Список гравців (клієнтський пошук), коригування балів, патч, позивний, make-admin |
| `/admin/referrals` | perm `referrals` | Підтвердження/відхилення рефералів |
| `/admin/rental` | perm `rental` | Read-only список заявок на оренду |
| `/admin/joins` | perm `joins` | Read-only лог captcha join-challenge |
| `/admin/gallery` | perm `gallery` | Завантаження/приховування/видалення фото галереї |
| `/admin/export` | потрібно `players`\|`games`\|`checkin` | Хаб CSV-експорту (кнопки — за правами) |
| `/admin/export/[kind]` | (route.ts) | Роут завантаження CSV (`force-dynamic`) |

Деталі моделі прав і двошарового гейтингу — в `DOCS_AUTH.md`.

---

## Server Components vs клієнтські віджети

Уся структура сторінок — серверна. Клієнтськими (`"use client"`) є лише точкові інтерактивні віджети:

| Компонент | Тип | Призначення |
|---|---|---|
| `components/BugReport.tsx` | client | Глобальний плаваючий FAB + модалка «повідомити про баг»: валідація картинки (png/jpeg, ≤5 MB) і base64 на клієнті, POST `{description,email,screenshotBase64,meta:{url,lang,userAgent,viewport}}` на `/api/bug-report`. Лейбли резолвляться на сервері й передаються пропсами (`app/layout.tsx:30-46`, монтується `app/layout.tsx:113`) |
| `components/site/GalleryGrid.tsx` | client | Мозаїка cols×3, обчислена жадібно **на клієнті** (`Math.random` у `useEffect`) — навмисно, щоб уникнути hydration mismatch; ротація надлишкових фото кожні 3.5 с; лайтбокс з клавіатурою (←/→/Esc) |
| `components/ThemeToggle.tsx` | client | Перемикач світла/темна: пише `localStorage('rxteam-theme')`, тогл `.dark` на `<html>` |
| `components/LangSwitcher.tsx` | client | Дропдаун мови: ставить cookie `rx_lang` + `router.refresh()` у transition |
| `components/site/NavLink.tsx` | client | Активний пункт навігації через `usePathname` (prefix-match, якщо не exact); у хедері й підменю адмінки |
| `AnnouncementBlock` | client | Згортання блоку анонсу |
| `AuthForm`, `TelegramLoginButton`, `LinkTelegramForm`, `RegisterForm`, `CheckinButton`, `GameActions`, `PlayersAdmin`, `GalleryUploader` | client | Форми/інтерактив, прив'язані до server actions (`useFormState`/`useFormStatus` або звичайний `<form action={...}>` зі hidden-інпутами) |
| `GameCard`, `RankingTable`, `SocialLinks` | server | Презентація без власного стану |

Server actions як механізм мутацій: `AuthForm`/`LinkTelegramForm` використовують `useFormState`/`useFormStatus`; `RegisterForm`/`CheckinButton`/`GameActions`/плитки магазину — звичайний `<form action={...}>` з hidden-інпутами (`app/shop/page.tsx:138-143`).

---

## Кореневий shell (`app/layout.tsx`)

Єдиний shell сайту — Server Component. Він:

1. Резолвить мову `getServerLang()` (`app/layout.tsx:24`) і сесію `getSessionContext()` (`:25`).
2. Обчислює `loggedIn = ctx.state !== "anon"` (`:26`) та `admin = ctx.state === "linked" && isAdmin(ctx.player)` (`:27`).
3. Рендерить хедер-навігацію: anon бачить лише Home + Login; залогінений — Shop / Cabinet / Logout; адмін — додатково посилання Admin (`:74-97`).
4. Інжектить no-flash скрипт теми (`:21`, `:57`) і шрифт Montserrat (`:53-56`).
5. Монтує глобальні клієнт-віджети `BugReport`/`ThemeToggle`/`LangSwitcher` (`:99-100`, `:113`).

Гейт адмінки в навігації — лише видимість лінка; реальна авторизація — у `app/admin/layout.tsx` + `lib/admin.ts` (див. `DOCS_AUTH.md`).

---

## Контекст сесії (трьохстановий)

`getSessionContext()` (`lib/session-player.ts:20-39`) — єдиний резолвер, що повертає один із трьох станів:

| Стан | Коли | Значення |
|---|---|---|
| `anon` | немає TG-cookie і немає Supabase-користувача | не залогінений |
| `unlinked` | є Supabase email-користувач, але немає прив'язаного `players` | `{ authUserId, email }` |
| `linked` | є рядок `players` (через TG-cookie або email-identity) | `{ authUserId, email, player }` |

Порядок перевірки важливий: **спершу** власна TG-сесія (`readTgSession`, `lib/session-player.ts:21-26`), і лише потім Supabase email-сесія (`:29-38`). Якщо TG-cookie резолвиться в існуючого гравця — він виграє, `authUserId` синтезується як `tg:<id>`, `email` = `null`. Повна модель auth/прав — у `DOCS_AUTH.md`.

---

## i18n у JSX

Кожен видимий рядок — це `st(lang, key, vars)` з плаского словника `SITE` в `lib/site-i18n.ts`. Модуль **чистий** (без `next/headers`), тож придатний і для клієнт-, і для серверкомпонентів.

| Елемент | Деталь |
|---|---|
| Словник | `SITE: Record<string, Record<Lang, string>>`, мови `pl` / `en` / `uk` (`lib/site-i18n.ts:6`) |
| Доступ | `st(lang, key, vars)` — інтерполяція `{k}` через split/join (`lib/site-i18n.ts:847-851`) |
| Мова на сервері | `getServerLang()` → `resolveLang(cookie rx_lang, accept-language)` (`lib/server-lang.ts:5-9`) |
| Мова в клієнтах | передається пропсами з сервера (напр. лейбли `BugReport` резолвляться в layout) |
| Резолюція | cookie `rx_lang` → `Accept-Language` (pl/en) → дефолт `uk` (`lib/site-i18n.ts:854-860`) |
| Перемикання | `LangSwitcher` пише cookie `rx_lang` (max-age 1 рік, samesite lax) і `router.refresh()` у transition — серверкомпоненти переренеряться з новою мовою; клієнтського стану перекладу немає |

---

## Тема (без `dark:`-класів)

Тема — клас `.dark` на `<html>`. Інлайн-скрипт у layout (`app/layout.tsx:20-21,57`) читає `localStorage('rxteam-theme')` до першого рендера, щоб не було «спалаху». `ThemeToggle` (клієнт, `components/ThemeToggle.tsx:11-23`) перемикає клас і зберігає вибір. Кольори перемикаються через CSS-змінні (напр. `var(--c-brand-text)`), а **не** через Tailwind `dark:`-варіанти — це правило закріплене в design-system (`docs/design-system/README.md:52`, ADR-0006). Деталі токенів і тем — у `docs/design-system/`.

---

## Middleware (`middleware.ts`)

`middleware.ts:5-42` на кожному non-`/api` запиті виконує `createServerClient` + `supabase.auth.getUser()`, щоб ротувати токени Supabase. Fail-safe: якщо публічні env-змінні Supabase відсутні — пропускає без сесії (не валить у 500, `:11`); мережеві/Supabase-помилки глушаться (`:36-40`). Matcher (`:45-48`) виключає `/api`, статику `_next`, `favicon.ico` і будь-які файли з розширенням — тобто API/webhook-роути middleware **не** покриває.

---

## UI / дизайн-система (не дублювати тут)

Реалізація токенів — у `components/ui/` (барель `components/ui/index.ts`): `ui.*` (типографіка/поверхні/поля/таблиці/банери), `badgeClass()`, навігаційні хелпери (`components/ui/styles.ts`), `btn(kind)` (`components/ui/buttons.ts`). За правилами вигляду (кнопки, заголовки, бейджі, кольори, шрифти, відступи, таблиці, модалки) звертайся **виключно** до `docs/design-system/README.md` та підрозділів `docs/design-system/` — тут вони навмисно не повторюються.

---

## Підводні камені / важливо

- **Немає loading/error/Suspense UX.** У `app/` нема жодного `loading.tsx`/`error.tsx`/`not-found.tsx` і `<Suspense>`. Повільний фетч на `force-dynamic`-сторінці блокує весь маршрут без скелета; помилки спливають у дефолтну error-сторінку Next.
- **GalleryGrid порожній на першому SSR-рендері.** Розкладка рахується через `Math.random` лише в `useEffect` на клієнті (`components/site/GalleryGrid.tsx:83-87`), щоб уникнути hydration mismatch — тож зона галереї спершу порожня й «з'являється» після монтування. На лендінгу показується лише коли `feature_gallery !== "false"` і є фото (`app/page.tsx:21,48-57`).
- **Дефолтна мова — `uk`.** Якщо нема cookie і `Accept-Language` не збігається з pl/en, мова = українська (`lib/site-i18n.ts:859`), попри те що спільнота базована у Вроцлаві (Польща).
- **Відсутні переклади спливають мовчки.** `st()` падає на `SITE[key].en`, якщо нема ключа для активної мови, і на сам рядок-ключ, якщо ключа нема взагалі (`lib/site-i18n.ts:848`) — не помилка, а англійський текст або літеральний ключ.
- **Гейтинг адмінки дубльований.** Layout робить грубий `getAdmin()`-гейт, але кожна сторінка мусить сама викликати `requirePerm`/`requireMaster`. Нова адмін-сторінка без власного гейта буде доступна будь-якому адміну (layout перевіряє лише «чи взагалі адмін»). Деталі — `DOCS_AUTH.md`.
- **Дві паралельні auth-механіки.** Supabase email-сесія (освіжається в `middleware.ts`) і власний TG-cookie (`rx_tg_session`), який у `getSessionContext` перевіряється **першим** (`lib/session-player.ts:21-26`) — TG-cookie виграє, якщо є обидві.
- **Розбіжність типів кнопок.** `docs/design-system/README.md` (принцип 7, ADR-0026) згадує ТРИ типи кнопок (`action`/`delete`/`ghost`), але реалізація `components/ui/buttons.ts` визначає лише ДВА (`action`/`delete`) — `ghost` у коді відсутній.
- **Не плутати з типографікою TMS Delltex.** Глобальний `CLAUDE.md` TMS Delltex (7 рівнів, лише `text-lg/sm/xs`) до цього репозиторію **не застосовується** — RX Team має власну систему (Montserrat, 6 рівнів, `text-2xl/xl/base/sm/xs`); див. `docs/design-system/`.
- **UTF-8 BOM у деяких файлах адмінки.** Частина сторінок (напр. `app/admin/games/page.tsx`, `settings`, `roles`, `referrals`, `rental`, `joins`) має невидимий BOM/символ перед першим `import` — нешкідливо, але непослідовно.
