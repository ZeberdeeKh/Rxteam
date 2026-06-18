# DOCS_BOT — Telegram-бот

Telegram-бот RX Team побудований на **grammY** і працює через webhook (`app/api/bot/route.ts`). Він виконує три головні ролі: **анти-бот шилд** (капча при заявці на вступ до групи), **ігровий цикл** гравця (ігри, чек-ін, профіль, реферали, нашивка, ранги) та **зв'язок сайт↔Telegram** (`/linksite` + cookie `rx_tg_session`). Уся бізнес-логіка ходить у БД через service-role-клієнт `lib/supabase` (RLS вимкнено — див. `architecture/adr/0018-rls-off-server-side-authz.md`). Цей документ описує саме бот-підсистему; серверні дії та cron — у DOCS_BACKEND.md, схема таблиць — у DOCS_DATABASE.md, сесії й вхід — у DOCS_AUTH.md.

## Архітектура та точки входу

| Файл | Призначення |
|------|-------------|
| `lib/bot.ts` | Головний бот: команди, callback-и, покрокові діалоги, шилд, гард топіка «Анонси», `chat_member`, нотифікації. Екземпляр `export const bot = new Bot(process.env.BOT_TOKEN!)` (`lib/bot.ts:51`) |
| `app/api/bot/route.ts` | Webhook-ендпойнт. `webhookCallback(bot, "std/http", { secretToken: WEBHOOK_SECRET })`, лише `POST`, `runtime="nodejs"`, `dynamic="force-dynamic"` |
| `lib/bot-commands.ts` | Єдине джерело меню-команд (pl/uk/en) для `setMyCommands` |
| `lib/captcha.ts` | `makeChallenge()` — капча `a + b`, 4 варіанти відповіді |
| `lib/bot-texts.ts` | Тексти капчі та FAQ із `settings` (ключі `captcha_*`, `cap_ok_*`, `cap_wrong_*`, `cap_expired_*`, `faq_*`), fallback з `lib/i18n.ts` |
| `lib/identities.ts` | `createLinkCode` / `redeemLinkCode` для `/linksite`; резолв player↔auth-user |
| `lib/tg-session.ts` | HMAC-підписана cookie `rx_tg_session` (вхід через Login Widget) |
| `lib/tg-auth.ts` | `verifyTelegramAuth` (підпис віджета) + `isAuthFresh` (24 год) |
| `app/auth/telegram/route.ts` | Callback Login Widget → ставить `rx_tg_session` |
| `lib/notify.ts` | Raw-fetch нотифікації майстер-адміну/адмінам (баг-репорти, покупки) |
| `lib/settings.ts` | `featureEnabled` (за замовчуванням ON), `getSetting` / `setSetting` |
| `scripts/set-webhook.ts` | Реєстрація webhook (`setWebhook`) + базові меню команд |

### Webhook (`app/api/bot/route.ts`)

```ts
const handle = webhookCallback(bot, "std/http", {
  secretToken: process.env.WEBHOOK_SECRET,
});
export async function POST(req: Request) { return handle(req); }
```

grammY сам звіряє заголовок Telegram `X-Telegram-Bot-Api-Secret-Token` із `WEBHOOK_SECRET` — окремого гарду в коді немає. Експонується **лише POST**.

## Реєстрація webhook (`scripts/set-webhook.ts`)

Запуск **після** деплою:

```bash
BASE_URL=https://<app>.vercel.app BOT_TOKEN=... WEBHOOK_SECRET=... npm run set-webhook
```

Скрипт викликає `setWebhook` на `${BASE_URL}/api/bot` із:

| Поле | Значення |
|------|----------|
| `allowed_updates` | `["chat_join_request", "chat_member", "callback_query", "message"]` (`scripts/set-webhook.ts:34`) |
| `secret_token` | `WEBHOOK_SECRET` (або `undefined`, якщо не задано) |
| `drop_pending_updates` | `true` |

> `chat_join_request` **не** входить у дефолтні апдейти Telegram — його обов'язково треба перелічити явно, інакше шилд не отримає заявок.

Далі скрипт через `setMyCommands` ставить базові меню для скоупів `default` і `all_private_chats` за `language_code` клієнта (`MENU_LANGS = ["uk","pl","en"]`), а також дефолт без `language_code` — англійською (`bot-commands.ts:62`, `set-webhook.ts:43-52`). Точне per-chat меню ставиться пізніше при зміні мови через `/lang` (`lib/bot.ts:1439`, scope `chat`).

## Інвентар команд

Усі команди гравця обмежені приватом (`if (ctx.chat.type !== "private") return`). Меню (видиме в Telegram) визначене в `lib/bot-commands.ts`; адмін-команди в меню **відсутні**, але працюють, якщо їх набрати вручну.

### Команди в меню (видимі)

| Команда | Рядок | Призначення |
|---------|-------|-------------|
| `/start` | `lib/bot.ts:203` | Старт; розбирає payload `g<id>` (картка гри) і `ref<id>` (реферал) |
| `/profile` | `lib/bot.ts:773` | Профіль: callsign, ранг, ігри, бали, надійність |
| `/games` | `lib/bot.ts:258` | Список найближчих анонсованих ігор (записатись/виписатись) |
| `/checkin` | `lib/bot.ts:1042` | Чек-ін на гру (геолокація у вікні `checkin_from..checkin_to`) |
| `/top` | `lib/bot.ts:800` | Топ-10 гравців + власне місце |
| `/patch` | `lib/bot.ts:1193` | Запит на членську нашивку |
| `/rank` | `lib/bot.ts:1369` | Поточний ранг + купівля наступного (`economy`) |
| `/ref` | `lib/bot.ts:220` | Реферальне посилання `?start=ref<id>` (потрібна ≥1 зіграна гра) |
| `/drivers` | `lib/bot.ts:300` | Список водіїв (carpool) на гру |
| `/myride` | `lib/bot.ts:589` | Керування власною поїздкою (водій) |
| `/rules` | `lib/bot.ts:794` | Правила / FAQ (`getFaqText`) |
| `/lang` | `lib/bot.ts:764` | Зміна мови (pl/en/uk) |
| `/cancel` | `lib/bot.ts:845` | Скасувати поточний покроковий діалог (`clearState`) |

### Команди поза меню (адмінські / службові)

Перевірка прав — `hasPerm(p, perm)` (майстер має всі права; інакше `admin_perms[]`), `lib/bot.ts:185`.

| Команда | Рядок | Гейт / призначення |
|---------|-------|--------------------|
| `/linksite` | `lib/bot.ts:242` | `feature site_link`; видає 6-символьний код прив'язки на 15 хв |
| `/lottery` | `lib/bot.ts:398` | perm `games` + `feature lottery`; квартальна лотерея надійних |
| `/stats` | `lib/bot.ts:455` | Статистика кварталу |
| `/poll` | `lib/bot.ts:498` | perm `games` + `feature voting`; пост-голосування за локацію |
| `/pollclose` | `lib/bot.ts:538` | Закрити голосування |
| `/admin` | `lib/bot.ts:834` | Показ панелі прав (лише `is_admin`); **не** обмежено приватом |
| `/sethere` | `lib/bot.ts:852` | У групі: прив'язати топік «Анонси» (лише адмін групи) |
| `/setchores` | `lib/bot.ts:896` | У групі: прив'язати групу/топік чек-листів підготовки |
| `/choresdiag` | `lib/bot.ts:946` | Діагностика чек-листів |
| `/addlocation` | `lib/bot.ts:991` | Покроковий діалог створення локації |
| `/locations` | `lib/bot.ts:1003` | Список локацій |
| `/newgame` | `lib/bot.ts:1020` | Покроковий діалог анонсу гри |
| `/markcheckin` | `lib/bot.ts:1082` | perm `checkin`; ручний чек-ін гравця без геолокації |

> Для перегляду повного списку джерел капчі/FAQ-текстів — `lib/bot-texts.ts`; усі рядкові ключі — `lib/i18n.ts` (`faq`, `captchaPrompt`).

## Анти-бот шилд (join request → captcha → approve/decline)

Шилд керується тоглом `feature shield`. Потік (`lib/bot.ts:1594-1696`):

1. **Заявка** (`bot.on("chat_join_request")`, `lib/bot.ts:1594`).
   - Якщо `shield` **вимкнено** → одразу `approveChatJoinRequest` і вихід (`lib/bot.ts:1597-1604`).
   - Якщо увімкнено → `makeChallenge()` (`a + b`, 4 варіанти), запис у `join_challenges` (`upsert` на `chat_id,user_id`) зі `status='pending'` і `expires_at = now + 4 хв` (`lib/bot.ts:1606-1619`).
   - Капча відправляється в **приват** користувача (`req.user_chat_id`) з inline-кнопками `cap:<число>` (`lib/bot.ts:1621-1628`). Якщо у користувача закритий приват — DM не доходить (помилка логується).

2. **Відповідь** (`bot.callbackQuery(/^cap:(-?\d+)$/)`, `lib/bot.ts:1631`).
   - Береться остання `pending`-челендж користувача.
   - **Прострочено** → `status='expired'`, текст «прострочено», `declineChatJoinRequest` (`lib/bot.ts:1649-1657`).
   - **Правильно** → `approveChatJoinRequest`, `status='passed'`, `recordMemberSeen`, текст «вірно»; далі — онбординг (нижче) (`lib/bot.ts:1659-1686`).
   - **Невірно** → `declineChatJoinRequest`, `status='failed'`, текст «помилка» (`lib/bot.ts:1687-1693`).

Статуси `join_challenges`: `pending → passed | failed | expired`. Прострочені `pending`-челенджі добиває cron `cleanup` (`declineChatJoinRequest` + `status='expired'`) — див. DOCS_BACKEND.md.

### Капча (`lib/captcha.ts`)

```ts
const a = 1 + Math.floor(Math.random() * 8);   // 1..8
const b = 1 + Math.floor(Math.random() * 8);   // 1..8
const answer = a + b;                           // правильна відповідь
// + 3 дистрактори (answer ± 3, > 0), перемішані → options: number[] (len 4)
```

Тексти капчі/відповідей — тримовні, через `buildCaptchaText/Correct/Wrong/Expired` (`lib/bot-texts.ts`), беруться з `settings` (ключі `captcha_*`, `cap_ok_*`, `cap_wrong_*`, `cap_expired_*`), fallback — `lib/i18n.ts`.

## Онбординг (FAQ + вибір мови)

Після **успішної** капчі (`lib/bot.ts:1668-1686`):

1. Якщо `feature onboarding_faq` увімкнено → надсилається FAQ мовою гравця (`getFaqText(p.lang)`).
2. **Завжди** надсилається інлайн-вибір мови (`lang:pl` / `lang:en` / `lang:uk`).

Вибір мови (`bot.callbackQuery(/^lang:(pl|en|uk)$/)`, `lib/bot.ts:1433`) зберігає мову (`setPlayerLang`) і ставить точне меню `setMyCommands` зі scope `chat` для цього користувача. FAQ також доступний будь-коли через `/rules` (`lib/bot.ts:794`).

## Нотифікації (`lib/notify.ts`)

Нотифікації йдуть **сирим fetch** до Telegram Bot API (`https://api.telegram.org/bot${BOT_TOKEN}`), а не через `bot.api`:

| Функція | Кому | Тригер |
|---------|------|--------|
| `notifyAdminsBugReport` | майстер-адмін(и) (`players.is_master`, `tg_user_id != null`) | `POST /api/bug-report` |
| `notifyAdminsPurchase` | усі адміни (`is_admin`), кожному його мовою | покупка в магазині (`buyItem`) |

Текст баг-репорту обрізається до 4096 символів; скрин (за наявності) шлеться окремим `sendPhoto`. Усі мережеві помилки тут навмисно ковтаються (`try/catch {}`). Нагадування про ігри та звіти чек-листів шлються з cron-роутів (`/api/cron/reminders`) — це не частина `lib/notify.ts`; деталі в DOCS_BACKEND.md.

## Гард топіка «Анонси»

Окремий middleware (`lib/bot.ts:68-167`), керований `feature announce_guard`. У прив'язаному чаті (`announce_chat_id`) і темі (`announce_thread_id`, або головній «General» при `announce_guard_general=true`) видаляє будь-який сторонній контент, лишаючи лише пости бота / від імені групи (`senderChat.id === chat.id`).

Ескалація для звичайних користувачів (лічильник `announce_violations`): **1-ше** порушення → попередження в приват; **2-ге і далі** → мут у групі на 1 год (`restrictChatMember`, `ANNOUNCE_MUTE_SECONDS = 3600`) + пояснення в приват. Прив'язка топіка — команда `/sethere` (лише адмін групи).

## Зв'язок сайт↔Telegram

Підтримуються **два** незалежні шляхи лінкінгу (двойна модель сесій — `architecture/adr/0022-dual-auth-email-and-telegram.md`):

### 1. Код прив'язки (`/linksite`)

| Крок | Деталі |
|------|--------|
| Бот | `/linksite` → `createLinkCode(player.id, tgUserId)` (`lib/identities.ts:19`): гарантує telegram-`identities`-рядок, генерує 6-символьний код (алфавіт без `0/O/1/I/L`), TTL **15 хв**, запис у `link_codes` |
| Сайт | Користувач (email-сесія) вводить код → `redeemLinkCode(code, authUserId)` (`lib/identities.ts:50`): перевіряє `not_found`/`expired`/`used`/`taken`, створює email-`identities`-рядок, ставить `link_codes.used_at` |

Серверну дію `linkTelegram` (cabinet) гейтить `feature site_link`; деталі в DOCS_BACKEND.md.

### 2. Telegram Login Widget (`rx_tg_session`)

`app/auth/telegram/route.ts` (`GET`): приймає redirect Login Widget, перевіряє підпис `verifyTelegramAuth` (HMAC-SHA256 від `sha256(BOT_TOKEN)`, `lib/tg-auth.ts:5`) і свіжість `isAuthFresh` (**24 год**), знаходить/створює player (`ensurePlayer`), ставить cookie:

| Cookie | Деталі (`lib/tg-session.ts`) |
|--------|------------------------------|
| `rx_tg_session` | формат `<playerId>.<exp>.<sig>`, `sig = HMAC-SHA256` |
| Секрет | `SESSION_SECRET` → fallback `WEBHOOK_SECRET` → `"rx-dev-secret"` (`lib/tg-session.ts:6`) |
| TTL | `TG_SESSION_MAX_AGE = 30 днів` |
| Прапори | `httpOnly`, `secure`, `sameSite="lax"`, `path="/"` |

`readTgSession` валідує підпис і `exp`; читання/двойна модель сесій — у DOCS_AUTH.md.

## Feature-тогли, які зачіпають бота

`featureEnabled(key)` → читає `settings["feature_<key>"]`; **за замовчуванням ON** (увімкнено, доки значення не дорівнює рядку `"false"`) — `lib/settings.ts:15-18`.

| Тогл (`feature_*`) | Що вимикає | Рядок |
|---------------------|-----------|-------|
| `shield` | анти-бот капчу (off → авто-approve) | `lib/bot.ts:1597` |
| `onboarding_faq` | FAQ після капчі | `lib/bot.ts:1670` |
| `announce_guard` | гард топіка «Анонси» | `lib/bot.ts:73` |
| `announce_count` | лічильник учасників | `lib/bot.ts:2117` |
| `referrals` | `/ref` | `lib/bot.ts:224`, `716` |
| `site_link` | `/linksite` | `lib/bot.ts:246` |
| `lottery` | `/lottery` | `lib/bot.ts:406` |
| `voting` | `/poll` | `lib/bot.ts:506` |
| `patch` | `/patch` | `lib/bot.ts:1197` |
| `economy` | купівля рангу (`/rank`) | `lib/bot.ts:1373`, `1403` |

Налаштовуються в адмінці (`saveSettings`, perm master) — див. DOCS_BACKEND.md.

## Покрокові діалоги (state machine)

Бот веде покрокові майстри через `getState/setState/clearState` (`lib/state.ts`). Дані вводяться текстом (`bot.on("message:text")`, `lib/bot.ts:1720`) або геолокацією (`bot.on("message:location")`, `lib/bot.ts:1700`):

- **Локація** (`/addlocation`): `loc_name → loc_pin → loc_radius` (пін мапою або «lat, lng» текстом; радіус 200/300/500 м або 20..5000).
- **Чек-ін** (`/checkin`): state `checkin` → надіслати геолокацію → `handleCheckin`.

`/cancel` скидає будь-який активний state.

## Змінні середовища

| Змінна | Призначення |
|--------|-------------|
| `BOT_TOKEN` | токен бота (екземпляр `Bot`, raw-fetch у `notify.ts`, перевірка віджета) |
| `WEBHOOK_SECRET` | secret-token webhook; **fallback-ключ для `rx_tg_session`** |
| `SESSION_SECRET` | пріоритетний ключ підпису `rx_tg_session` (якщо заданий) |
| `BASE_URL` | (лише `set-webhook`) база для URL `/api/bot` |

## Підводні камені / важливо

- **Адмін-команди не в меню, але працюють.** `/lottery`, `/poll`, `/markcheckin`, `/newgame` тощо відсутні в `bot-commands.ts`, проте обробники активні — їх можна набрати вручну. `/admin` навіть не обмежено приватом.
- **`featureEnabled` за замовчуванням TRUE.** Відсутній ключ `feature_*` означає «увімкнено». Щоб щось вимкнути, треба явно записати рядок `"false"` (`lib/settings.ts:17`).
- **`WEBHOOK_SECRET` — fallback-ключ сесії.** Якщо `SESSION_SECRET` не заданий, `rx_tg_session` підписується `WEBHOOK_SECRET` (`lib/tg-session.ts:6`). Ротація `WEBHOOK_SECRET` інвалідовує всі активні TG-сесії; якщо обидва не задані — використовується захардкоджений `"rx-dev-secret"` (небезпечно на проді).
- **Капча слабка.** Арифметика `a+b` (1..8) з 4 варіантами легко проходиться скриптом — це базовий, а не криптостійкий бар'єр.
- **Капча приходить тільки в приват.** Якщо у користувача закритий приват для ботів, DM капчі не доходить (`lib/bot.ts:1626`) — користувач не зможе пройти шилд, поки cron `cleanup` не відхилить прострочену заявку.
- **`chat_join_request` має бути в `allowed_updates`.** Інакше шилд мовчить. Так само `chat_member` потрібен для обліку вступів/виходів (`lib/bot.ts:170`).
- **Прострочення капчі лежить на crow.** Сам бот ставить `expired` лише коли користувач натискає кнопку після TTL; «мовчазні» прострочені заявки добиває cron `cleanup` (DOCS_BACKEND.md).
- **Нагадування ≠ Vercel cron.** `/api/cron/reminders` (нагадування про ігри, що йдуть із серверного боку) **не** заплановано у `vercel.json` — потрібен зовнішній пінгер (cron-job.org, кожні ~15 хв) із `Authorization: Bearer CRON_SECRET`. Без нього нагадування не шлються. Деталі — DOCS_BACKEND.md.
- **Прив'язку топіка робить `/sethere` у групі**, а не в адмінці; для головної теми форуму «General» `thread_id` відсутній — це нормально (`announce_guard_general=true`).
