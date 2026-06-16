# Документація RX Team

Технічна документація проєкту — сайт + Telegram-бот спільноти ASG/Airsoft (Wrocław).
Стек: **Next.js 14 (App Router) + Tailwind + Supabase + grammY**, деплой на Vercel.

> **Звідки почати:** [DOCS_OVERVIEW.md](DOCS_OVERVIEW.md) — карта системи й зміст усієї документації.

## 1. Документація проєкту (як усе працює)

| Документ | Про що |
|---|---|
| [DOCS_OVERVIEW.md](DOCS_OVERVIEW.md) | Карта системи (сайт + бот + Supabase + Vercel), потоки запитів, деплой, зміст |
| [DOCS_FRONTEND.md](DOCS_FRONTEND.md) | App Router, карта маршрутів, серверні компоненти, сесія, i18n |
| [DOCS_BACKEND.md](DOCS_BACKEND.md) | Шар `lib/` (дані + бізнес-логіка), Server Actions, Route Handlers, крони |
| [DOCS_BOT.md](DOCS_BOT.md) | grammY-бот: команди, анти-бот шилд, онбординг, нотифікації, лінк сайт↔TG |
| [DOCS_DATABASE.md](DOCS_DATABASE.md) | Схема PostgreSQL (24 таблиці), міграції `etap*.sql`, RLS off |
| [DOCS_AUTH.md](DOCS_AUTH.md) | Подвійна авторизація (email + Telegram), 3 стани сесії, ролі/права |

## 2. Стандарт дизайну (як виглядає UI)

| Документ | Про що |
|---|---|
| [design-system/README.md](design-system/README.md) | Принципи + карта + ухвалені рішення (OD1–OD8) |
| [design-system/01-foundations.md](design-system/01-foundations.md) | Типографіка, колір/теми, відступи, ширини |
| [design-system/02-components.md](design-system/02-components.md) | Кнопки, бейджі, форми, картки, таблиці, модалки |
| [design-system/03-patterns.md](design-system/03-patterns.md) | Розкладка, рецепти, каталог «не так / так» |
| [design-system/04-content-and-icons.md](design-system/04-content-and-icons.md) | Тексти, i18n, політика емодзі |
| [design-system/05-exceptions.md](design-system/05-exceptions.md) | Санкціоновані винятки |
| [design-system/tokens-reference.md](design-system/tokens-reference.md) | Довідник усіх токенів |
| [design-system/CONTRIBUTING.md](design-system/CONTRIBUTING.md) | Як змінювати систему + чек-лист PR |

## 3. Технічні рішення (чому саме так)

[architecture/adr/README.md](architecture/adr/README.md) — **28 ADR** (MADR): 0001–0015 дизайн,
0016–0022 архітектура, 0023–0028 стандартизація. Будь-яка зміна правила дизайну/архітектури → новий ADR.

## 4. Рефакторинг

[refactoring/README.md](refactoring/README.md) — **план із 12 етапів** (+ Етап 0) приведення коду
до стандарту: безпечний порядок, ризик/файли/ADR на кожен етап, DoD, трекер прогресу.

## Статус

- ✅ Документація проєкту — створено (2026-06-16).
- ✅ Дизайн-стандарт + ADR — узгоджено (рішення OD1–OD8 ухвалено).
- ✅ План рефакторингу — готовий ([refactoring/README.md](refactoring/README.md)).
- ✅ **Рефакторинг виконано** (2026-06-16, локально): усі 13 етапів, `tsc` + `next build` зелені.
  Лишилось — візуальна перевірка в браузері та коміт (на рішення засновника).

> Застарілий [PROMPT_SITE.md](PROMPT_SITE.md) — ранній брифінг; актуальне — у `DOCS_*` вище.
