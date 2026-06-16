# 03 — Патерни розкладки

Як збираються сторінки. Однаковий тип сторінки → однакова структура.

---

## 1. Каркас сторінки

```tsx
<div className={ui.pageStack}>            {/* space-y-6 — стек секцій */}
  {banners}                                {/* ui.alertOk / ui.alertErr зверху */}
  <section className={ui.card}> … </section>
  <section> <h2 className={`mb-3 ${ui.sectionTitle}`}>…</h2> … </section>
</div>
```

- Корінь сторінки — **завжди** `ui.pageStack` (а не сирий `space-y-8/10`).
- Інтервал заголовок→контент — **`mb-3` на заголовку**, не `mt-*` на контенті.
- Центровані сторінки — обгортка `mx-auto {ширина}` зі шкали [01-foundations §4](01-foundations.md) (`max-w-md` / `max-w-2xl` / `max-w-[66rem]`).

## 2. Секція

`<section>` = (опційно картка `ui.card`) + заголовок `ui.sectionTitle` (`<h2>`) + контент.
Заголовок секції завжди `<h2>` (не `<legend>` — це окремий елемент форми). Не дублювати
активний пункт меню як заголовок сторінки ([ADR-0015](../architecture/adr/0015-no-duplicate-active-nav-as-page-title.md)).

## 3. Рецепт CRUD-сторінки адмінки

Еталон — [admin/locations](../../app/admin/locations/page.tsx). Структура однакова для всіх:

```
ui.pageStack
├─ banners (ok / err за searchParams)
├─ <section ui.card> «Додати X»
│    └─ <form action={createX}> TopFields + Controls + btn("action") «Створити»
└─ список:
     порожньо → ui.emptyState
     інакше → ui.listStack з карток ui.card, у кожній:
        <form action={updateX} id={x-id}> поля </form>
        ряд дій: btn("action") form={x-id} «Зберегти» · btn("delete") «Видалити» · ui.link · ml-auto meta
```

Поля винесені у дрібні функції (`TopFields`, `LimitControls`) → **однаковий рядок у формі
створення і правки**. Кнопка «Зберегти» прив'язана до форми через `form={id}` (лежить поза `<form>`).

## 4. Патерн фідбеку (успіх/помилка)

Серверний екшен робить `redirect("…?saved=1")` / `?err=<code>`. Сторінка читає `searchParams`
і показує `ui.alertOk`/`ui.alertErr` зверху. Конвенція:

- успіх: `?created` / `?saved` / `?deleted` / доменні (`?reg` / `?checkin` …) → `ui.alertOk`;
- помилка: `?err=fields` (порожні поля) / `?err=inuse` / `?err=<code>` → `ui.alertErr`.

Клієнтські форми (`AuthForm`, `BugReport`) — стан у компоненті (`state.error`, статус-машина).
Уніфікувати коди помилок між сторінками (один словник `err_*` в i18n).

## 5. Розкладка «ключ–значення»

Два дозволені варіанти, кожен — для свого:

- **Профіль/зведення** (сітка): `dl.grid grid-cols-2 gap-y-3 sm:grid-cols-3`, `dt`=`ui.meta`, `dd`=`ui.bodyStrong` (еталон — [cabinet профіль](../../app/cabinet/page.tsx#L134), але **через токени**, не хардкод).
- **Картка-деталі** (рядки): `dl.space-y-1`, `dt.w-20 shrink-0` (підпис) + `dd` (значення) — [GameCard](../../components/site/GameCard.tsx#L30).

Не змішувати: те саме зведення на різних сторінках — однаковим варіантом.

## 6. Адаптивність

- Брейкпоінт — практично лише `sm:`. Мобільний — базові класи; від `sm` — `sm:grid-cols-*`, `sm:inline`.
- Шапка/підменю переносяться через `flex-wrap` (без гамбургера).
- Таблиці — горизонтальний скрол через `overflow-x-auto` у `ui.tableWrap`.
- `md:`/`lg:` вводимо лише за реальної потреби й фіксуємо в ADR.

---

## 7. Каталог неконсистентностей (do this, not that)

Знайдено аудитом; виправляється в рефакторингу. Кожен пункт — «однаковий патерн має
виглядати однаково».

| ❌ Не так | ✅ Так |
|---|---|
| `BugReport` зі своїми `bg-brand-600`/`rose-600`/`emerald-50`, полями, кнопками | `Modal` + `ui.input` + `btn()` + семантичні змінні (**OD1**) |
| Інлайн-лінк `text-[var(--c-brand-text)] hover:underline` вписаний 9+ разів | `ui.link` |
| Підпис поля — то `ui.label`, то `ui.meta` | `ui.fieldLabel` (**OD2**) |
| Поверхня картки вписана вручну (shop/social/roles) | `ui.card` / `ui.cardHover` |
| `text-amber-600` для попередження | `ui.warnText` |
| Тернар статус→колір скопійовано 3–5 разів | `gameStatusBadge()` / `referralStatusBadge()` |
| Порожній стан 3 способами | `ui.emptyState` |
| Адмін-таблиці з `overflow-x-auto`, публічні — без | `overflow-x-auto` у `ui.tableWrap` |
| `gray-400` хардкодом ~15 разів | `ui.metaFaint` (**OD3**) |
| Профіль кабінету хардкодить `ui.meta`/`ui.bodyStrong` 6 разів | токени |
| `space-y-8/10` на корені сторінки | `ui.pageStack` (**OD8**) |
| `max-w-sm/md/lg/2xl` без правила | шкала ширин (**OD8**) |
| `font-mono` на `<code>` ролей | `ui.bodyStrong` + brand-text |
| Перемикач режиму в `AuthForm` як друга праймері-кнопка | `ui.link` (**OD6**) |
| `mb-3`/`mt-1`/`mt-2`/`mt-3` упереміш | `mb-3` на заголовку |
| Іконкові/overlay/FAB кнопки кожна по-своєму | `ui.iconBtn` / `ui.overlayBtn` / `ui.fab` |
| Чекбокс/радіо хардкодом; радіо в RegisterForm дрібне | `ui.checkbox` / `ui.radio` |
| fieldset-бокс і legend 3 способами | `ui.fieldBox` + `ui.legend` |
| Адмін-пігулки — сирий enum | локалізований підпис (**OD5**) |
| `focus:ring-2 ring-brand-500` у BugReport | канон focus-ring |
| Емодзі-індикатори ad hoc | політика гліфів (**OD4**, [04](04-content-and-icons.md)) |
| `disabled:opacity-40/60` | `opacity-50` |
| Ряд дій: save праворуч / delete окремою формою | канонічний порядок [02 §1.1](02-components.md) |
| Ціна/баланс хардкодом двома відтінками | `ui.price` |
