# 0029. Мілітарний рестайл у стилі ab3.army (помаранч + квадрат + chamfer)

- **Статус:** Прийнято (Accepted) — рішення засновника 2026-06-16
- **Дата:** 2026-06-16
- **Категорія:** Дизайн-система
- **Теги:** palette, fonts, buttons, cards, radius, background, ab3
- **Перекриває:** [ADR-0001](0001-montserrat-sole-font-family.md), [ADR-0004](0004-single-brand-text-token.md), [ADR-0005](0005-khaki-military-brand-palette.md), [ADR-0008](0008-exactly-two-button-kinds.md), [ADR-0009](0009-muted-semantic-colors.md)
- **Доповнює:** [ADR-0003](0003-uppercase-brand-headings.md), [ADR-0006](0006-dark-theme-via-css-variables.md), [ADR-0026](0026-icon-overlay-fab-and-modal.md)
- **Референс:** https://ab3.army/ (сайт 3-го армійського корпусу)

## Контекст і проблема
Засновник вирішив, що поточний вигляд (хакі-палітра, Montserrat, заокруглені картки/кнопки,
приглушена семантика — успадковані з «Kalkulator») не подобається, і треба максимально
наблизити сайт до мілітарного стилю ab3.army. Аналіз CSS ab3 дав чітку мову дизайну:
помаранчевий акцент на оливково-чорному тлі, повністю квадратні елементи, плоский вигляд,
картки зі зрізаними кутами (chamfer) + spotlight, темний градієнтний фон. Це системна зміна,
що зачіпає кольори, шрифти, кнопки, картки й радіуси одночасно.

## Розглянуті варіанти
- Лишити стандарт, додати лише помаранчевий акцент — відхилено: засновник хоче саме вигляд ab3, косметика не вирішує.
- Скопіювати ab3 буквально, включно зі шрифтом **UAF Sans** — відхилено: UAF Sans — офіційний шрифт ЗСУ, RX — страйкбол; брати його некоректно (етично/юридично).
- **Перенести мову дизайну ab3 на власні токени** (вільний аналог шрифту, наша архітектура CSS-змінних) — прийнято.

## Рішення
1. **Палітра.** PRIMARY = помаранч `#f6921e` (ховер `#f08407`, deep `#e16709`). Поверхні —
   оливково-чорні (`--c-white #11131d`, фон-градієнт `#070e0e→#11131d`). Хакі **демотовано**
   до другорядного акценту `--c-beige #d6b588`. Перекриває [ADR-0005](0005-khaki-military-brand-palette.md).
2. **`--c-brand-text` = помаранч** (`#f6921e`) замість хакі. Єдиний токен заголовків/лого
   зберігається. Перекриває [ADR-0004](0004-single-brand-text-token.md).
3. **Шрифти.** Тіло — `Mulish`; заголовки/кнопки — `Oswald` (utility `font-display`), вільний
   мілітарний аналог. Перекриває «єдиний Montserrat» [ADR-0001](0001-montserrat-sole-font-family.md);
   правило UPPERCASE-заголовків [ADR-0003](0003-uppercase-brand-headings.md) лишається (тепер через Oswald).
4. **Кнопки — 4 типи** (`outline` / `action` / `delete` / `ghost`): квадратні (`rounded-none`),
   плоскі (`shadow-none`), `border-2`, UPPERCASE, шрифт display, опційна трейлінг-стрілка
   (`.btn-arrow`). `outline` — дефолт-стиль ab3 (прозорий + помаранчева рамка); `action` —
   SOLID-помаранч CTA. Перекриває [ADR-0008](0008-exactly-two-button-kinds.md)/[ADR-0026](0026-icon-overlay-fab-and-modal.md).
5. **Квадрат скрізь.** `borderRadius`-шкала Tailwind = `0px` (крім `full`). Картки — зрізані кути
   через `clip-path` (`.rx-chamfer`), є варіант `.rx-notch` і `.rx-spotlight`. Свідомі винятки
   круглих елементів: FAB, кругла icon-кнопка успіху/overlay (`rounded-full`). **Новий принцип.**
6. **Семантика — яскрава ab3** (`success #4caf50`, `danger #ff6b6b`, `warning` беж). Перекриває
   «лише приглушені» [ADR-0009](0009-muted-semantic-colors.md).
7. **Фон — темний градієнт** `linear-gradient(5.61deg,#070e0e,#11131d)` на `body` + гачок
   `--page-photo` під майбутнє фото з затемненням знизу. Доповнює [ADR-0006](0006-dark-theme-via-css-variables.md)
   (підхід CSS-змінних не змінюється).

Архітектура «стилі лише через токени» ([ADR-0010](0010-tokens-only-styling.md)) **зберігається** —
зміна локалізована в `tailwind.config.ts`, `globals.css`, `components/ui/{buttons,styles}.ts`.

## Наслідки
- ✅ Сайт виглядає як мілітарний підрозділ ab3, але на власному стеку й без чужого шрифту ЗСУ.
- ✅ Зміна централізована: 6 файлів ядра + точкова чистка радіусів.
- ⚠️ `clip-path` обрізає бордер — рамку малюємо нижнім шаром (`.rx-chamfer::before`); модалки
  з прокруткою лишаємо просто квадратними (без chamfer).
- ⚠️ Аліас `brand` тимчасово вказує на помаранч (щоб старі класи `bg-brand`/`ring-brand` не
  ламались) — мігрувати на `primary`/`--c-primary` поступово.
- ⚠️ Гайди `design-system/01-foundations`, `02-components`, `tokens-reference` ще тримають старі
  значення (хакі/Montserrat) — оновити під це ADR (TODO).

## Підтвердження в коді
- `tailwind.config.ts` — `primary`/`beige`/`olive`, `fontFamily.display=Oswald`, `borderRadius` усе `0px`.
- `app/globals.css` — `:root` нові змінні, фон-градієнт + `--page-photo`, класи `.rx-chamfer`/`.rx-notch`/`.rx-spotlight`/`.btn-arrow`.
- `app/layout.tsx` — шрифт-`<link>` Oswald+Mulish.
- `components/ui/buttons.ts` — 4 типи, square/flat/uppercase.
- `components/ui/styles.ts` — картки на `.rx-chamfer`, квадратні бейджі/поля/таблиці/банери, ab3-навігація; круглі винятки збережено.
- `components/ui/SpotlightCard.tsx` — нова обгортка chamfer/notch + spotlight за курсором.
- `public/icons/arrow-top-right.svg` — стрілка для `.btn-arrow`.
- Повний план і чеклист: [docs/AB3_REDESIGN_PLAN.md](../../AB3_REDESIGN_PLAN.md).
