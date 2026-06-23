# 02 — Компоненти

Як виглядає й поводиться кожен повторюваний елемент. Усе — через `@/components/ui`.

---

## 1. Кнопки

**3 типи** ([ADR-0008](../architecture/adr/0008-exactly-two-button-kinds.md), доповнено
[ADR-0026](../architecture/adr/0026-icon-overlay-fab-and-modal.md)). Однаковий шрифт, розмір
шрифту й висота; **змінюється лише ширина** (за довжиною тексту). Розмірів (`sm/md`) **немає**.

```tsx
btn("action")   // створення / збереження / підтвердження / позитивна дія (хакі, заливка)
btn("delete")   // деструктивна дія: видалення (червона --c-danger-solid)
btn("ghost")    // нейтральна/другорядна дія: cancel, «прикріпити» (без заливки, тиха)
<Button kind="action">…</Button>   // обгортка для <button>
```

`ghost` навмисно тихий (`bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800`),
щоб не конкурувати з `action`. Не вживати `ghost` там, де потрібна головна дія.

- На всю ширину (форми авторизації, діалоги): `${btn("action")} w-full`.
- **Посилання-кнопка** (`<a>`/`<Link>`, що виглядає як дія): `btn("action")` напряму.
- **Disabled:** `disabled:opacity-50` (вже в `btn`). Якщо кнопку вимкнено з причини — **обов'язково** `title="…"` з поясненням ([locations](../../app/admin/locations/page.tsx#L185) — еталон). Уніфікувати на `opacity-50` (зараз є `opacity-40`/`opacity-60`).

### 1.1 Ряд дій (action row)

Канонічний порядок у картці/рядку запису:

```
[ btn("action")  «Зберегти» ] [ btn("delete")  «Видалити» ] [ ui.link інше ] … [ ml-auto: meta праворуч ]
```

Обгортка ряду: `flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3`
(еталон — [locations](../../app/admin/locations/page.tsx#L176)). Save завжди перший,
delete — другий. Не «зберегти праворуч через `ml-auto`», не «delete окремою формою нижче».

### 1.2 Вторинні / нейтральні дії

> ✅ **OD6 (вирішено).** Додано 3-й тип `btn("ghost")` для нейтральних **кнопок** (cancel у
> модалці, тригер «прикріпити»). **Чиста навігація** (перемикач «увійти↔реєстрація») —
> текстове `ui.link`, не кнопка (зараз помилково друга `btn("action")` —
> [AuthForm.tsx:74](../../components/auth/AuthForm.tsx#L74)). [ADR-0026](../architecture/adr/0026-icon-overlay-fab-and-modal.md)

### 1.3 Іконкові, плаваючі та on-media кнопки (додати токени)

| Токен | Значення | Замість |
|---|---|---|
| `ui.iconBtn` | `flex h-7 w-7 items-center justify-center rounded text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50` + focus-ring | [ThemeToggle.tsx:32](../../components/ThemeToggle.tsx#L32), хрестик [BugReport.tsx:231](../../components/BugReport.tsx#L231) |
| `ui.fab` | `fixed bottom-4 right-4 z-40 … rounded-full bg-neutral-800 text-neutral-50 shadow-lg … dark:bg-neutral-100 …` | плаваюча кнопка [BugReport.tsx:182](../../components/BugReport.tsx#L182) — **єдиний** санкціонований `dark:` ([ADR-0007](../architecture/adr/0007-dark-variant-exception-bugreport-fab.md)) |
| `ui.overlayBtn` / `ui.overlayIconBtn` | контролі поверх фото: `bg-white/10 text-neutral-50 hover:bg-white/20`, `rounded-full` (іконка) / `rounded-md px-3 py-1.5` (текст) | лайтбокс [GalleryGrid.tsx:194,214,222](../../components/site/GalleryGrid.tsx#L194) |

---

## 2. Посилання

Інлайн-посилання — `text-[var(--c-brand-text)] hover:underline`. Зараз цей рецепт вписано
вручну **9+ разів** і він уже «поплив» (з/без `font-medium`, з/без `text-sm`, один лінк
фарбується лише на hover).

**Додати `ui.link`** = `text-[var(--c-brand-text)] hover:underline` і мігрувати всі місця.
CTA з «→» — той самий `ui.link` + стрілка в тексті. Заголовок-посилання (`cardTitle`, що
веде кудись) — `cardTitle` + `hover:text-[var(--c-brand-text)]` (не міняти на інший рецепт).

---

## 3. Бейджі та статуси

Єдина пігулка через `badgeClass(color)`: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium`,
кольори з семантичних змінних. **Не хардкодити плашки.**

| Колір | Де |
|---|---|
| `brand` | Майстер, ачівки |
| `green` | Адмін, `announced`, `registered` |
| `gray` | Гравець, `hidden`, інше (дефолт) |
| `red` | `cancelled`, `no_show`, ачивка `legendary` |
| `amber` | попередження, `pending` |
| `bronze` / `silver` / `gold` | рівні ачивок «під медалі»: `easy` / `mid` / `hard` (токени `--c-{metal}-bg/fg`) |

### 3.1 Мапа статус→колір — у хелпер

Тернар `announced/registered→green, cancelled/no_show→red, else→gray` зараз скопійовано
в [admin/games](../../app/admin/games/page.tsx#L116), [games/[id]](../../app/admin/games/[id]/page.tsx#L86),
[cabinet](../../app/cabinet/page.tsx#L194). **Винести в `gameStatusBadge(status)` і
`referralStatusBadge(status)`** — мапа має жити в одному місці. Дефолтний колір невідомого
статусу — `gray` (referrals зараз розходиться на `amber`).

### 3.2 Текст пігулки

> ✅ **OD5 (вирішено).** Локалізувати скрізь (ключі `gamest_*`/`regst_*`) — текст пігулки
> однаковий на адмінці й на сторінках користувача. [ADR-0025](../architecture/adr/0025-status-badge-helpers.md)

---

## 4. Поля та форми

| Токен | Значення |
|---|---|
| `ui.input` | `w-full rounded-md border border-gray-300 … px-3 py-2 text-sm … focus:ring-1 ring-brand` |
| `ui.inputSm` | компактний варіант (`px-2 py-1 text-xs`) |
| `textarea` | той самий `ui.input` (за потреби `+ resize-y`) |

**Додати** (зараз хардкод):

| Новий токен | Значення | Замість |
|---|---|---|
| `ui.checkbox` | `h-4 w-4 accent-brand` | 6+ місць |
| `ui.radio` | `h-4 w-4 accent-brand` | [RegisterForm.tsx:41,52](../../components/cabinet/RegisterForm.tsx#L41) — там радіо **без** `h-4 w-4`, рендериться дрібним |
| `ui.fileInput` | `block w-full text-sm … file:mr-3 file:rounded-md file:border-0 file:bg-[var(--c-action-bg)] file:px-3 file:py-1.5 file:text-[var(--c-action-fg)] hover:file:bg-[var(--c-action-bg-hover)]` | [GalleryUploader.tsx:69](../../components/admin/GalleryUploader.tsx#L69) |
| `ui.fieldBox` | `rounded-md border border-gray-200 p-3` | fieldset-«бокс», зараз вписаний 3 способами |
| `ui.legend` | `px-1 text-xs font-semibold uppercase tracking-wide text-gray-500` | legend, зараз `ui.meta`/`ui.sectionTitle`/inline |

### 4.1 Композиція поля (стек: підпис над полем)

```tsx
<label className="text-sm">
  <span className={ui.fieldLabel}>{підпис}</span>
  <input className={ui.input} … />
</label>
```

> ✅ **OD2 (вирішено).** `ui.fieldLabel = mb-1 block text-sm font-medium text-gray-700`
> (text-sm) для основних форм; `ui.meta` (text-xs) лишається лише для підпідписів усередині
> вкладених fieldset. [ADR-0023](../architecture/adr/0023-tokenize-recurring-recipes.md)

- **Required:** атрибут `required` (+ `minLength`/`maxLength`). Окремої зірочки `*` немає — лишаємо так.
- **Сітка форми:** `grid gap-3 sm:grid-cols-2` (звичайна) або `sm:grid-cols-12` з `col-span-*` (рядок різноширотних полів). Самодостатній fieldset зі своєю сіткою не залежить від колонок батька.
- **Submit:** одна `btn("action")` внизу форми, ліворуч (у ряді дій — за порядком з §1.1).

### 4.2 Валідація

Помилки — **банером** зверху (`ui.alertErr`), а не під полем. Серверні екшени віддають
помилку через `searchParams` (`?err=fields` / `?err=<code>`) або стан форми (`state.error`).
Уніфікувати конвенцію кодів (див. [03-patterns.md](03-patterns.md) §фідбек).

---

## 5. Картки та поверхні

| Токен | Значення |
|---|---|
| `ui.card` | `rounded-lg border border-gray-200 bg-white p-5` |
| `ui.cardHover` | `ui.card` + `transition hover:border-brand` |
| `ui.panel` | `rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600` (підказка/нотатка) |

**Не вписувати поверхню вручну.** Зараз `rounded-lg border … bg-white p-5` скопійовано в
[shop ShopTile](../../app/shop/page.tsx#L84),
а в [roles](../../app/admin/roles/page.tsx#L79) «поплило» на `bg-gray-50 p-4`. Усе — через `ui.card`/`ui.cardHover`.

**Картка-список** (рядки з роздільниками, як історія балів [cabinet](../../app/cabinet/page.tsx#L247)):
винести в токен `ui.listCard` = `divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white`.

Внутрішній роздільник картки — `border-t border-gray-100 pt-3/pt-4`.

---

## 6. Таблиці, списки, згортувані

**Таблиця:** `ui.tableWrap` + `ui.table` + `ui.thead`/`ui.th` + `ui.tbody`/`ui.td`. Числові
колонки — `text-right tabular-nums`. Еталон — [RankingTable](../../components/site/RankingTable.tsx).

> **Виправити:** адмін-таблиці обгортають у `overflow-x-auto … bg-white`, публічні
> ([RankingTable](../../components/site/RankingTable.tsx#L16), [shop journal](../../app/admin/shop/page.tsx#L153)) —
> голий `ui.tableWrap`, тож на вузькому екрані обрізаються. **Внести `overflow-x-auto` + `bg-white` у `ui.tableWrap`.**

**Списки:** `ui.listStack` (`space-y-3`) для стеку карток; `ui.pageStack` (`space-y-6`) для стеку секцій.

**Згортувані записи:** компонент `Collapsible` на нативному `<details>`
([ADR-0012](../architecture/adr/0012-collapsible-native-details.md)). Однотипні «повторювані
записи» (гравці, ролі, групи налаштувань) — через `Collapsible`, симетричні. Редаговані
картки локацій навмисно НЕ згортувані (форма правки розгорнута) — це задокументований виняток.

**Порожній рядок таблиці/списку** — див. §8.

---

## 7. Навігація

- **Шапка:** `headerNavClass(active)` для пунктів, `headerAdminClass(active)` для «Адмінки». Sticky, `z-30`, `border-b`, `backdrop-blur`.
- **Підменю адмінки:** `subNavClass(active)`, обгортка `flex flex-wrap gap-2 border-b border-gray-200 pb-3` ([admin/layout.tsx](../../app/admin/layout.tsx#L19)).
- **`NavLink`** визначає активний стан; пункти — UPPERCASE `tracking-wide`.
- **Не дублювати** активний пункт меню великим `<h1>` ([ADR-0015](../architecture/adr/0015-no-duplicate-active-nav-as-page-title.md)).
- **Перемикачі** теми/мови + вертикальний роздільник (`mx-1 h-5 w-px bg-gray-200`) — у кінці шапки.
- Гамбургер-меню/мобільної навігації **немає** — пункти просто переносяться (`flex-wrap`). Якщо їх стане більше — це окреме рішення (ADR).

---

## 8. Банери та порожні стани

**Банери:** `ui.alertOk` / `ui.alertErr` / `ui.alertWarn` (семантичні, приглушені). Показуються
зверху сторінки за `searchParams`.

**Порожній стан («немає даних»)** зараз стилізовано **трьома** способами: dashed-бокс
([home](../../app/page.tsx#L105), [RankingTable](../../components/site/RankingTable.tsx#L9), games, shop),
голий `ui.muted` (адмін), сирий `text-sm text-gray-500` (кабінет). **Уніфікувати:**

```
ui.emptyState = rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500
```

Використовувати `ui.emptyState` скрізь, де «список порожній / гра не запланована / немає
результатів». Короткі inline-«немає» (всередині рядка) лишаються `ui.muted`.

---

## 9. Модалки й оверлеї

Зараз модалка є лише в [BugReport](../../components/BugReport.tsx) та лайтбокс у
[GalleryGrid](../../components/site/GalleryGrid.tsx) — і вони побудовані по-різному.
Канонічний патерн оверлея (винести в `Modal`):

- Бекдроп: `fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4`.
- Закриття по кліку на бекдроп лише якщо натиск **почався** на бекдропі (`pressOnBackdrop`), Esc, та хрестик `ui.iconBtn`.
- Контейнер: `max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-2xl` (модалка має бути `rounded-lg`, як решта поверхонь — зараз у BugReport кутів немає).
- Структура: шапка (`border-b px-5 py-4`, заголовок + хрестик) → тіло (`space-y-3 p-5`) → футер дій (`flex justify-end gap-2 border-t px-5 py-3`).
- Поля всередині — `ui.input`; кнопки — `btn()`; помилки — `ui.negText`; успіх-іконка — `ui.successIconCircle` (`bg-[var(--c-success-bg)] text-[var(--c-success-fg)]`, **не** `bg-emerald-50`).

> ✅ **OD1 (вирішено).** `BugReport` **мігрує** на `ui.*`/`btn()`/`Modal`/семантичні змінні:
> надіслати → `btn("action")`, cancel → `btn("ghost")`, поля → `ui.input`, хрестик →
> `ui.iconBtn`, помилки → `ui.negText`, успіх-кружок → `ui.successIconCircle`. [ADR-0028](../architecture/adr/0028-bugreport-migrate-or-whitelist.md)

---

## 10. Роздільники

- Вертикальний (у шапці): `mx-1 h-5 w-px bg-gray-200`.
- Горизонтальний всередині картки: `border-t border-gray-100 pt-*`.
- «АБО»-роздільник (дві лінії + текст): `flex items-center gap-3 text-xs uppercase text-gray-400` + `h-px flex-1 bg-gray-200` з боків ([cabinet](../../app/cabinet/page.tsx#L70), [login](../../app/login/page.tsx#L32)). Винести в маленький компонент `OrDivider`.
