# RX Team — Стандарт дизайну платформи

> **Єдине джерело правди для всього UI.** Будь-яка зміна вигляду (кнопки, заголовки,
> бейджі, кольори, шрифти, відступи, поля, таблиці, списки, модалки) робиться **суворо
> за цією документацією**. Якщо патерн застосовано в одному місці — у кожному
> подібному місці він має виглядати **так само**.

Цей набір замінює монолітний [docs/DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) (той тепер —
короткий покажчик сюди). Стандарт ширший: він описує не лише шрифти й кнопки, а всю
систему — від кольорів і відступів до розкладки сторінок, форм, станів «порожньо», модалок та іконок.

---

## Де живуть токени в коді

Документація описує правила; **реалізація** — у трьох файлах. Документ і код мають збігатися.

| Файл | Що містить |
|---|---|
| [components/ui/styles.ts](../../components/ui/styles.ts) | `ui.*` — типографіка, поверхні, поля, таблиці, банери, бейджі, навігація |
| [components/ui/buttons.ts](../../components/ui/buttons.ts) | `btn()` — кнопки (рівно 2 типи) |
| [app/globals.css](../../app/globals.css) | усі кольори як CSS-змінні + світла/темна теми |

Барель [components/ui/index.ts](../../components/ui/index.ts) реекспортує `ui`, `btn`,
`badgeClass`, `Button`, `Collapsible`, навігаційні хелпери. **Імпортуй лише звідти.**

---

## Карта документів

| Документ | Про що |
|---|---|
| [01-foundations.md](01-foundations.md) | Типографіка, кольори/теми, відступи, шкала ширин, радіуси, тіні, z-index, анімація |
| [02-components.md](02-components.md) | Кнопки, посилання, бейджі, поля/форми, картки, таблиці/списки, навігація, банери, порожні стани, модалки, іконкові кнопки |
| [03-patterns.md](03-patterns.md) | Розкладка сторінки, ритм, ряд дій, рецепти форм, CRUD-сторінка адмінки, патерн фідбеку, адаптивність |
| [04-content-and-icons.md](04-content-and-icons.md) | Тексти, регістр, i18n (PL/UA/EN), формати чисел/дат/грошей, політика емодзі/гліфів |
| [05-exceptions.md](05-exceptions.md) | Реєстр санкціонованих відхилень (кожне — з посиланням на ADR) |
| [tokens-reference.md](tokens-reference.md) | Плоский довідник усіх `ui.*`/`btn()`/`badgeClass()` (назва → значення → що замінює) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Як змінювати систему + чек-лист для PR |

Технічні рішення (чому саме так) — в [ADR](../architecture/adr/README.md).

---

## 10 принципів (стисло)

1. **Єдине джерело.** Жодних хардкод-класів Tailwind для кнопок/карток/заголовків/бейджів у сторінках — лише `@/components/ui`. ([ADR-0010](../architecture/adr/0010-tokens-only-styling.md))
2. **Один шрифт.** Montserrat усюди. Жодного `font-mono`/другого сімейства. ([ADR-0001](../architecture/adr/0001-montserrat-sole-font-family.md))
3. **Обмежена шкала.** 6 рівнів типографіки, 5 розмірів (`text-2xl/xl/base/sm/xs`). Інших розмірів немає. ([ADR-0002](../architecture/adr/0002-restricted-type-scale.md))
4. **ВЕРХНІЙ РЕГІСТР** для заголовків/меню/кнопок; `cardTitle` — виняток (власні назви). ([ADR-0003](../architecture/adr/0003-uppercase-brand-headings.md))
5. **Один хакі-токен.** Весь оливковий текст — `text-[var(--c-brand-text)]`. Ніколи `text-brand*`. ([ADR-0004](../architecture/adr/0004-single-brand-text-token.md))
6. **Темна тема без `dark:`.** Сірі/семантичні токени перемикаються самі через CSS-змінні. ([ADR-0006](../architecture/adr/0006-dark-theme-via-css-variables.md))
7. **3 типи кнопок.** `action` (хакі), `delete` (червона), `ghost` (тиха — нейтральні дії). Без розмірів. ([ADR-0008](../architecture/adr/0008-exactly-two-button-kinds.md) + [ADR-0026](../architecture/adr/0026-icon-overlay-fab-and-modal.md))
8. **Приглушена семантика.** success/danger/warning — м'які пастелі/тінти. Єдиний насичений — `--c-danger-solid` для кнопки delete. ([ADR-0009](../architecture/adr/0009-muted-semantic-colors.md))
9. **Однаковий патерн — однаковий вигляд.** Той самий тип елемента в подібному контексті стилізується ідентично (бейдж статусу, порожній стан, підпис поля, ряд дій).
10. **Зміна стилю = ADR.** Будь-яке нове правило/токен або виняток фіксуються в [ADR](../architecture/adr/README.md).

---

## ✅ Ухвалені рішення (2026-06-16)

Усі 8 відкритих питань вирішено. ADR 0023–0028 — у статусі «Прийнято».

| # | Рішення | ADR |
|---|---|---|
| **OD1** | BugReport **мігрує** на `ui.*`/`btn()`/`Modal`/семантичні змінні | [0028](../architecture/adr/0028-bugreport-migrate-or-whitelist.md) |
| **OD2** | Підпис поля — `text-sm` (`ui.fieldLabel`); `ui.meta` лише для вкладених fieldset | [0023](../architecture/adr/0023-tokenize-recurring-recipes.md) |
| **OD3** | Лишаємо окремий третинний рівень `ui.metaFaint` (`text-xs text-gray-400`) | [0023](../architecture/adr/0023-tokenize-recurring-recipes.md) |
| **OD4** | Єдиний набір гліфів-констант у `components/ui` | [0027](../architecture/adr/0027-emoji-glyph-policy.md) |
| **OD5** | Адмін-пігулки **локалізуємо** (як на сторінках користувача) | [0025](../architecture/adr/0025-status-badge-helpers.md) |
| **OD6** | **Додаємо 3-й тип `ghost`**; навігація — `ui.link` | [0026](../architecture/adr/0026-icon-overlay-fab-and-modal.md) |
| **OD7** | Вордмарк зберігає вагу 800 (`ui.wordmark`, лише лого) | [0023](../architecture/adr/0023-tokenize-recurring-recipes.md) |
| **OD8** | `ui.pageStack` всюди + шкала ширин `max-w-md / 2xl / 66rem` | [0024](../architecture/adr/0024-standardize-rhythm-and-widths.md) |
