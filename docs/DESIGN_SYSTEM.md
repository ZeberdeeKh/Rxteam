# RX Team — Стандарт дизайну

> 🟧 **2026-06-16 — мілітарний рестайл ab3.army.** Палітра (помаранч + оливка), шрифти
> (Oswald + Mulish), квадратні елементи (radius 0) + chamfer-картки, темний градієнт-фон.
> Авторитетне джерело змін — [ADR-0029](architecture/adr/0029-ab3-military-restyle.md) +
> повний план [AB3_REDESIGN_PLAN.md](AB3_REDESIGN_PLAN.md). Гайди нижче ще містять старі
> значення (хакі / Montserrat) — оновлюються поступово.

> 📦 **Документ розгорнуто в набір.** Стандарт став ширшим (кольори, відступи, розкладка,
> форми, стани, модалки, іконки), тож живе тепер у папці:

## → [docs/design-system/](design-system/README.md)

| Документ | Про що |
|---|---|
| [design-system/README.md](design-system/README.md) | Принципи + карта + реєстр відкритих рішень |
| [design-system/01-foundations.md](design-system/01-foundations.md) | Типографіка, колір/теми, відступи, ширини, радіуси, тіні, z-index |
| [design-system/02-components.md](design-system/02-components.md) | Кнопки, посилання, бейджі, форми, картки, таблиці, навігація, банери, модалки |
| [design-system/03-patterns.md](design-system/03-patterns.md) | Розкладка сторінок, ритм, ряд дій, рецепти форм, фідбек, адаптивність |
| [design-system/04-content-and-icons.md](design-system/04-content-and-icons.md) | Тексти, i18n, формати, політика емодзі |
| [design-system/05-exceptions.md](design-system/05-exceptions.md) | Санкціоновані винятки |
| [design-system/tokens-reference.md](design-system/tokens-reference.md) | Довідник усіх токенів |
| [design-system/CONTRIBUTING.md](design-system/CONTRIBUTING.md) | Як змінювати систему + чек-лист PR |

Технічні рішення (чому саме так) — [docs/architecture/adr/](architecture/adr/README.md).

Реалізація в коді: [styles.ts](../components/ui/styles.ts) · [buttons.ts](../components/ui/buttons.ts) · [globals.css](../app/globals.css).
