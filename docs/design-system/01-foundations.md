# 01 — Основи (foundations)

Базові токени, з яких збирається все інше: типографіка, колір, відступи, ширини, радіуси, тіні, шари, рух.

---

## 1. Типографіка

Шрифт — **Montserrat** (ваги 400/500/600/700/800), заданий глобально на `html,body`
([globals.css:83-85](../../app/globals.css#L83-L85)). Жодного другого сімейства — `font-mono`
**заборонено** ([ADR-0001](../architecture/adr/0001-montserrat-sole-font-family.md)).

### 1.1 Рівні (лише ці)

| Токен `ui.*` | Призначення | Значення |
|---|---|---|
| `display` | герой-заголовок | `text-2xl font-bold uppercase tracking-tight` + brand-text |
| `pageTitle` | заголовок сторінки (`<h1>`) | `text-xl font-bold uppercase tracking-tight` + brand-text |
| `sectionTitle` | заголовок секції (`<h2>`) | `text-base font-semibold uppercase tracking-wide` + brand-text |
| `cardTitle` | назва картки/елемента (`<h3>`) | `text-base font-semibold text-gray-900` — **без uppercase** |
| `bodyStrong` | акцентований текст | `text-sm font-medium text-gray-900` |
| `body` | основний текст | `text-sm text-gray-700` |
| `label` | підпис поля | `text-sm font-medium text-gray-700` |
| `muted` | другорядний текст | `text-sm text-gray-500` |
| `meta` | дрібний/допоміжний | `text-xs text-gray-500` |

**Дозволені розміри: `text-2xl, text-xl, text-base, text-sm, text-xs`. Інших немає**
([ADR-0002](../architecture/adr/0002-restricted-type-scale.md)). Виняток — нетекстові
гліфи (емодзі, стрілки галереї): їхній розмір — це розмір *іконки*, не тексту, і
шкалою не обмежений (див. [05-exceptions.md](05-exceptions.md)).

### 1.2 Регістр і tracking

- `display/pageTitle/sectionTitle`, пункти меню та кнопки — **UPPERCASE** ([ADR-0003](../architecture/adr/0003-uppercase-brand-headings.md)).
- `cardTitle` — нормальний регістр: там власні назви (ігри, позивні).
- Tracking прив'язано до розміру: великі заголовки — `tracking-tight`; дрібні UPPERCASE-підписи/меню — `tracking-wide`. **`tracking-widest` не вживаємо** (зараз є один випадок — [LinkTelegramForm.tsx:37](../../components/cabinet/LinkTelegramForm.tsx#L37), прибрати).

### 1.3 Ваги

`400` (body/muted/meta) · `500` (bodyStrong/label) · `600` (sectionTitle/cardTitle) · `700` (display/pageTitle).
Вага **800** — лише вордмарк.

> ✅ **OD7 (вирішено).** Вага **800** лишається — лише для лого, винесена в `ui.wordmark`
> (`text-xl font-extrabold uppercase tracking-wide` + brand-text). Шкала ваг: 400/500/600/700 + 800 (лого). [ADR-0023](../architecture/adr/0023-tokenize-recurring-recipes.md)

### 1.4 Підрівні без власного токена (додати)

| Новий токен | Значення | Замість |
|---|---|---|
| `ui.legend` / eyebrow | `px-1 text-xs font-semibold uppercase tracking-wide text-gray-500` | hand-rolled «над-підпис» ([AnnouncementBlock.tsx:14](../../components/site/AnnouncementBlock.tsx#L14), [cabinet/page.tsx:131](../../app/cabinet/page.tsx#L131)) — він дослівно дорівнює `ui.thead` |
| `ui.price` / numStrong | `text-sm font-semibold text-[var(--c-brand-text)]` | акцентовані числа/ціни ([shop/page.tsx:91,108](../../app/shop/page.tsx#L91)) |

### 1.5 Line-height

Поточно `leading-relaxed` зустрічається рівно один раз ([page.tsx:44](../../app/page.tsx#L44)).
**Правило:** багаторядковий `body`-текст (опис, анонс) — `leading-relaxed`; заголовки й
однорядкові підписи — типовий leading. Не застосовувати ad hoc.

---

## 2. Колір і теми

Усі кольори — **CSS-змінні** в [globals.css](../../app/globals.css). Темна тема працює
**без `dark:`-варіантів**: `gray-*` і `white` прив'язані до `--c-gray-*`/`--c-white`, які
перевизначаються під `html.dark` ([ADR-0006](../architecture/adr/0006-dark-theme-via-css-variables.md)).

### 2.1 Бренд (хакі, фіксований)

`brand` 50…950 (DEFAULT `#6b6a3c`) — **лише для фонів/меж/акцентів** (`bg-brand`, `bg-brand/10`,
`border-brand`, `accent-brand`, `ring-brand`). **Ніколи для тексту** ([ADR-0005](../architecture/adr/0005-khaki-military-brand-palette.md)).

### 2.2 `--c-brand-text` — єдиний хакі-текст

Один токен на **весь** оливковий текст: лого, усі заголовки, посилання, текст меню,
бренд-бейджі, заливка кнопки `action`. Світла `#545331`, темна `#9d9b66`. **Заборонено**
`text-brand` / `text-brand-dark` / `text-brand-light` ([ADR-0004](../architecture/adr/0004-single-brand-text-token.md)).

### 2.3 Поверхні/текст (перемикаються)

`gray-50…950` + `white`. **Не додавай `dark:` для кольору** — бери сірий токен. `neutral-*`
**не** перемикається — це фіксована світла палітра для тексту на кольорових кнопках.

**Межі:** канонічна межа поверхні — `border-gray-200`. `border-gray-100` — лише для
внутрішніх роздільників усередині картки (тонший). `border-gray-300` — поля вводу та
рамка порожнього стану (dashed). Не змішувати довільно.

### 2.4 Сірі рівні тексту

`ui.muted`/`ui.meta` = `gray-500`. Третинний текст (ключі налаштувань, `@username`, дрібні
позначки) зараз хардкодить `gray-400` у ~15 місцях.

> ✅ **OD3 (вирішено).** Лишаємо окремий рівень `ui.metaFaint = text-xs text-gray-400` для
> *третинного* тексту (ключі налаштувань, `@username`); усі `gray-400` мігрувати на нього. [ADR-0023](../architecture/adr/0023-tokenize-recurring-recipes.md)

### 2.5 Семантика (статуси/бейджі/банери) — приглушена

`success` / `danger` / `warning`, кожна має `-bg` (фон) і `-fg` (текст), плюс `-soft` для
дельт. Світла — м'які пастелі, темна — напівпрозорі тінти. **Без яскравих** (`green-500`,
`red-500`, `rose-600`, `emerald-50`, `amber-600` — заборонені). Єдиний насичений —
`--c-danger-solid` (#dc2626) для **кнопки** `delete` ([ADR-0009](../architecture/adr/0009-muted-semantic-colors.md)).

Текстові семантичні токени: `ui.posText`/`ui.negText` є; **додати `ui.warnText`** (`text-[var(--c-warning-fg)]`)
замість сирого `text-amber-600` ([admin/games/[id]/page.tsx:73](../../app/admin/games/[id]/page.tsx#L73)).

---

## 3. Відступи й ритм

Базова сітка — кроки Tailwind (4px). Канонічні значення:

| Роль | Значення |
|---|---|
| Стек секцій сторінки | `ui.pageStack` = `space-y-6` |
| Стек елементів списку | `ui.listStack` = `space-y-3` |
| Внутрішній стек форми | `space-y-4` |
| Заголовок секції → контент | **`mb-3` на заголовку** (не `mt-*` на контенті) |
| Сітка полів / груп | `gap-3` (поля), `gap-4` (групи в 2 колонки) |
| Горизонтальні відступи сторінки | `px-4` |

> ✅ **OD8 (вирішено).** Корінь сторінки — завжди через `ui.pageStack`; інтервал
> заголовок→контент — завжди `mb-3` на заголовку. Маркетинговий `space-y-10` для лендінгу —
> задокументований виняток ([05-exceptions](05-exceptions.md)). [ADR-0024](../architecture/adr/0024-standardize-rhythm-and-widths.md)

---

## 4. Ширина контейнерів

Глобальний контейнер — `max-w-[66rem]` (`mx-auto px-4`), однаково для шапки, `<main>` і
футера ([ADR-0013](../architecture/adr/0013-fixed-content-container-width.md)). Зараз —
магічне число лише в [layout.tsx](../../app/layout.tsx); винести в константу.

Центровані одноколонкові сторінки зараз беруть `max-w-sm/md/lg/2xl` без правила.

> ✅ **OD8 (вирішено) — 3-ступенева шкала:**
> `narrow` (форма авторизації, діалог) = `max-w-md` ·
> `prose` (центрована стаття/кабінет) = `max-w-2xl` ·
> `default` (контент сторінки) = `max-w-[66rem]`.

---

## 5. Радіуси, тіні, шари, рух

- **Радіуси:** картки/таблиці/банери — `rounded-lg`; поля/бейджі-кнопки/малі бокси — `rounded-md`; пігулки-бейджі — `rounded-full`. Інших не вводимо.
- **Тіні:** кнопки — `shadow-sm`; модалка — `shadow-2xl`; плаваюча кнопка — `shadow-lg`. Поверхні-картки — **без тіні** (тільки межа).
- **z-index (фіксовані шари):** `z-30` — шапка (sticky); `z-40` — плаваюча кнопка (FAB); `z-50` — оверлей модалки. Нових рівнів не вигадувати.
- **Рух:** `transition` на hover-станах; `duration-200`/`duration-300` для розгортань/появи. Анімація появи фото — `@keyframes rxFade` у globals.css.
- **Focus-ring:** поля — `focus:ring-1 ring-brand`; кнопки — `focus-visible:ring-2 ring-brand/50 ring-offset-1`. Один канон, без `ring-brand-500`/`ring-brand/40`.
