# RX Team — Дизайн-система

Єдине джерело стилів: [`components/ui/styles.ts`](../components/ui/styles.ts).
Імпорт: `import { ui, buttonClass, badgeClass, Button } from "@/components/ui";`

**Правило:** не хардкодимо Tailwind-класи по сторінках для типових елементів —
беремо токени звідси. Це гарантує однаковий вигляд скрізь.

## Бренд і теми
- Бренд — **хакі** (мілітарі-оливковий), `brand-*` (50–950, + аліаси `DEFAULT/dark/light`).
- Темна тема — автоматична через CSS-змінні (`tailwind.config.ts` + `globals.css`):
  - `gray-*` / `white` — **перемикаються** (поверхні, текст);
  - `brand-*` — хакі, **не** перемикається;
  - `neutral-50` — фіксований світлий (текст на кольорових кнопках);
  - `green/red/amber` — семантичні банери/бейджі, **не** перемикаються.
- Шрифт — **Montserrat** (Google Fonts), базова вага Regular 400.

## Типографіка (тільки ці рівні)
| Токен | Клас | Призначення |
|-------|------|-------------|
| `ui.display` | `text-3xl font-bold` | Герой лендінга |
| `ui.pageTitle` | `text-2xl font-bold` | Заголовок сторінки (H1) |
| `ui.sectionTitle` | `text-lg font-semibold` | Заголовок секції (H2) |
| `ui.cardTitle` | `text-base font-semibold` | Заголовок картки (H3) |
| `ui.body` / `ui.bodyStrong` | `text-sm` | Основний текст |
| `ui.muted` | `text-sm text-gray-500` | Другорядний текст |
| `ui.label` | `text-sm font-medium` | Підписи полів |
| `ui.meta` | `text-xs text-gray-500` | Дрібні підписи/мета |

Дозволені розміри шрифту: `text-3xl, text-2xl, text-lg, text-base, text-sm, text-xs`. Інші — ні.

## Кнопки — `buttonClass(variant, size)` або `<Button>`
- Варіанти: `primary` (хакі-залив), `secondary` (контур), `ghost`, `danger`.
- Розміри: `md` (типовий), `sm` (компактний, в адмінці/таблицях).
- `<button>` → компонент `<Button variant size>`; `<Link>`/`<a>` → `className={buttonClass(variant, size)}`.

## Бейджі — `badgeClass(color)`
Кольори: `brand` (роль майстра), `green` (адмін/успіх), `gray` (нейтрально), `red`, `amber`.

## Поверхні / поля / таблиці
- Картка: `ui.card` (статична) / `ui.cardHover` (клікабельна).
- Поле: `ui.input` (повне) / `ui.inputSm` (компактне).
- Банери: `ui.alertOk` / `ui.alertErr`.
- Таблиця: обгортка `ui.tableWrap`, `ui.table`, шапка `ui.thead`+`ui.th`, тіло `ui.tbody`+`ui.td`.
- Списки карток: контейнер `ui.listStack`; сторінка: `ui.pageStack`.
