# Architecture Decision Records (ADR)

Журнал технічних рішень у форматі **MADR**. Кожен файл — одне рішення: контекст, варіанти,
саме рішення, наслідки, підтвердження в коді. Шаблон — [0000-template.md](0000-template.md).

**Статуси:** `Прийнято` — діє; `Запропоновано` — чекає рішення засновника (OD); `Замінено` — є новіший ADR.

Зміна правила дизайн-системи чи архітектури → новий ADR (див. [CONTRIBUTING](../../design-system/CONTRIBUTING.md)).

## Дизайн-система (Прийнято)

| # | Рішення |
|---|---|
| [0001](0001-montserrat-sole-font-family.md) | Montserrat — єдиний шрифт |
| [0002](0002-restricted-type-scale.md) | Обмежена типографічна шкала: 6 рівнів, 5 розмірів |
| [0003](0003-uppercase-brand-headings.md) | Заголовки/меню/кнопки — UPPERCASE; cardTitle — виняток |
| [0004](0004-single-brand-text-token.md) | Єдиний токен `--c-brand-text` для всього хакі-тексту |
| [0005](0005-khaki-military-brand-palette.md) | Хакі/мілітарі палітра — лише фони/акценти |
| [0006](0006-dark-theme-via-css-variables.md) | Темна тема через CSS-змінні, без `dark:` |
| [0007](0007-dark-variant-exception-bugreport-fab.md) | Єдиний виняток `dark:` — FAB BugReport |
| [0008](0008-exactly-two-button-kinds.md) | Типи кнопок: action / delete (доповнено [0026](0026-icon-overlay-fab-and-modal.md): +`ghost`) |
| [0009](0009-muted-semantic-colors.md) | Лише приглушені семантичні кольори |
| [0010](0010-tokens-only-styling.md) | Стилі лише через токени `@/components/ui` |
| [0011](0011-no-component-library.md) | Без сторонньої UI-бібліотеки |
| [0012](0012-collapsible-native-details.md) | Згортувані на нативному `<details>` |
| [0013](0013-fixed-content-container-width.md) | Фіксована ширина контейнера `max-w-[66rem]` |
| [0014](0014-text-wordmark-not-logo-image.md) | Текстовий вордмарк замість лого-картинки |
| [0015](0015-no-duplicate-active-nav-as-page-title.md) | Не дублювати активний пункт меню заголовком |

## Архітектура (Прийнято)

| # | Рішення |
|---|---|
| [0016](0016-nextjs-app-router-server-actions.md) | Next.js App Router + Server Actions |
| [0017](0017-supabase-access-only-via-lib.md) | Доступ до Supabase лише через `lib/*` |
| [0018](0018-rls-off-server-side-authz.md) | RLS вимкнено — авторизація на сервері |
| [0019](0019-trilingual-i18n-split-site-vs-bot.md) | Тримовний i18n: окремо сайт і бот |
| [0020](0020-commit-to-main-equals-deploy.md) | Коміт у main = деплой (trunk-based) |
| [0021](0021-middleware-fail-safe-session-refresh.md) | Fail-safe оновлення сесії в middleware |
| [0022](0022-dual-auth-email-and-telegram.md) | Подвійна автентифікація: email + Telegram |

## Стандартизація — нові (Запропоновано, чекають рішень OD)

| # | Рішення | OD |
|---|---|---|
| [0023](0023-tokenize-recurring-recipes.md) | Винести повторювані рецепти в токени | OD2, OD3, OD7 |
| [0024](0024-standardize-rhythm-and-widths.md) | Уніфікувати ритм і ширини контейнерів | OD8 |
| [0025](0025-status-badge-helpers.md) | Хелпери статус→бейдж + локалізація пігулок | OD5 |
| [0026](0026-icon-overlay-fab-and-modal.md) | Токени icon/overlay/FAB + примітив Modal | OD6 |
| [0027](0027-emoji-glyph-policy.md) | Політика емодзі/гліфів | OD4 |
| [0028](0028-bugreport-migrate-or-whitelist.md) | BugReport: мігрувати чи виняток | OD1 |
