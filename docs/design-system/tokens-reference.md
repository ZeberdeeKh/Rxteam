# Довідник токенів

Плоский перелік усього, що експортує `@/components/ui`. Перед тим як вписати клас Tailwind
руками — знайди токен тут. Має збігатися з [styles.ts](../../components/ui/styles.ts) /
[buttons.ts](../../components/ui/buttons.ts).

## Чинні `ui.*`

### Типографіка
| Токен | Значення |
|---|---|
| `ui.display` | `text-2xl font-bold uppercase tracking-tight text-[var(--c-brand-text)]` |
| `ui.pageTitle` | `text-xl font-bold uppercase tracking-tight text-[var(--c-brand-text)]` |
| `ui.sectionTitle` | `text-base font-semibold uppercase tracking-wide text-[var(--c-brand-text)]` |
| `ui.cardTitle` | `text-base font-semibold text-gray-900` |
| `ui.bodyStrong` | `text-sm font-medium text-gray-900` |
| `ui.body` | `text-sm text-gray-700` |
| `ui.label` | `block text-sm font-medium text-gray-700` |
| `ui.muted` | `text-sm text-gray-500` |
| `ui.meta` | `text-xs text-gray-500` |

### Поверхні та поля
| Токен | Значення |
|---|---|
| `ui.card` | `rounded-lg border border-gray-200 bg-white p-5` |
| `ui.cardHover` | `ui.card` + `transition hover:border-brand` |
| `ui.panel` | `rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600` |
| `ui.input` | `w-full rounded-md border border-gray-300 … px-3 py-2 text-sm … focus:ring-1 ring-brand` |
| `ui.inputSm` | `… px-2 py-1 text-xs …` |

### Таблиці / списки / розкладка
| Токен | Значення |
|---|---|
| `ui.tableWrap` | `overflow-hidden rounded-lg border border-gray-200` |
| `ui.table` | `w-full text-sm` |
| `ui.thead` | `bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500` |
| `ui.th` / `ui.td` | `px-3 py-2 text-left` / `px-3 py-2 text-gray-700` |
| `ui.tbody` | `divide-y divide-gray-200` |
| `ui.pageStack` / `ui.listStack` | `space-y-6` / `space-y-3` |

### Банери / семантичний текст
| Токен | Значення |
|---|---|
| `ui.alertOk` / `ui.alertErr` / `ui.alertWarn` | `rounded-md … text-sm` + success/danger/warning bg+fg |
| `ui.posText` / `ui.negText` | `text-[var(--c-success-fg)]` / `text-[var(--c-danger-fg)]` |
| `ui.posDelta` / `ui.negDelta` | `text-[var(--c-success-soft)]` / `text-[var(--c-danger-soft)]` |

### Хелпери / кнопки
| Виклик | Що дає |
|---|---|
| `btn("action")` / `btn("delete")` | дві кнопки (хакі / червона) |
| `<Button kind>` | обгортка `<button>` |
| `badgeClass(color)` | пігулка: `brand`/`green`/`gray`/`red`/`amber` + метал ачивок `bronze`/`silver`/`gold` |
| `headerNavClass(active)` / `headerAdminClass(active)` / `subNavClass(active)` | пункти меню |
| `Collapsible` | згортуваний блок на `<details>` |

---

## Реалізовано рефакторингом (тепер чинні)

Усі додано в `components/ui` (Етап 0, 2026-06-16) і застосовано в коді. Кожен прибирає конкретний хардкод.

| Токен / хелпер | Значення | Замінює | OD |
|---|---|---|---|
| `ui.link` | `text-[var(--c-brand-text)] hover:underline` | інлайн-лінк (9+ місць) | — |
| `ui.warnText` | `text-[var(--c-warning-fg)]` | `text-amber-600` | — |
| `ui.emptyState` | `rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500` | 3 стилі порожнього стану | — |
| `ui.fieldLabel` | `mb-1 block text-sm font-medium text-gray-700` | `ui.label`/`ui.meta` як підпис поля | OD2 |
| `ui.legend` | `px-1 text-xs font-semibold uppercase tracking-wide text-gray-500` | legend/eyebrow 3 способами | — |
| `ui.fieldBox` | `rounded-md border border-gray-200 p-3` | fieldset-бокс | — |
| `ui.checkbox` / `ui.radio` | `h-4 w-4 accent-brand` | хардкод 6+ місць | — |
| `ui.fileInput` | `block w-full text-sm … file:… bg-[var(--c-action-bg)] …` | one-off у GalleryUploader | — |
| `ui.listCard` | `divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white` | список-картка (історія балів) | — |
| `ui.iconBtn` | `flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-200 …` | ThemeToggle, хрестик | — |
| `ui.overlayBtn` / `ui.overlayIconBtn` | `bg-white/10 text-neutral-50 hover:bg-white/20 …` | лайтбокс-контролі | — |
| `ui.fab` | `fixed bottom-4 right-4 z-40 … rounded-full bg-neutral-800 … dark:…` | плаваюча кнопка | — |
| `btn("ghost")` | `BTN_BASE` + `bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800` | 3-й тип кнопки (нейтральні дії: cancel, attach) | OD6 |
| `ui.price` | `text-sm font-semibold text-[var(--c-brand-text)]` | ціна/баланс | — |
| `ui.successIconCircle` | `… rounded-full bg-[var(--c-success-bg)] text-[var(--c-success-fg)]` | `bg-emerald-50` | OD1 |
| `ui.wordmark` | `text-xl font-extrabold uppercase tracking-wide text-[var(--c-brand-text)]` | вордмарк inline | OD7 |
| `ui.metaFaint` | `text-xs text-gray-400` | `gray-400` (~15 місць) | OD3 |
| `gameStatusBadge(status)` | → `badgeClass(...)` за мапою | тернар 3–5 копій | OD5 |
| `referralStatusBadge(status)` | → `badgeClass(...)` за мапою | тернар joins/referrals | OD5 |
| `Modal` (компонент) | бекдроп+контейнер+шапка/тіло/футер | патерн оверлея | OD1 |
| `OrDivider` (компонент) | дві лінії + текст | «АБО»-роздільник | — |
