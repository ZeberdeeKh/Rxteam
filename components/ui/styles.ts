// ─────────────────────────────────────────────────────────────────────────────
// Дизайн-система RX Team — ЄДИНЕ джерело стилів. Стиль ab3.army (Етап AB3):
// помаранчевий акцент, ПОВНІСТЮ КВАДРАТНІ елементи, плоский вигляд, картки зі
// зрізаними кутами (.rx-chamfer). Усі кнопки/картки/поля/таблиці/бейджі — звідси.
//
// Кольори (тема ЛИШЕ темна):
//   • gray-* / white  — темні поверхні (CSS-змінні, див. globals.css);
//   • brand-* / primary — помаранч (акцент, заголовки, активні стани);
//   • neutral-50      — фіксований світлий (текст на кольорових кнопках);
//   • green/red/amber — семантичні банери/бейджі (яскраві ab3).
//
// Типографіка: тіло Mulish, заголовки Oswald (font-display). Дозволені РІВНІ — лише ці:
//   display 2xl · pageTitle xl · sectionTitle base · cardTitle base · body sm · meta xs
// ─────────────────────────────────────────────────────────────────────────────

// Кнопки винесено в окремий модуль — див. ./buttons.ts (типи: outline / action / delete / ghost).

// ── Бейджі (КВАДРАТНІ, uppercase — стиль ab3) ──
// Семантичні кольори (green/red/amber) беруться з CSS-змінних.
export type BadgeColor = "brand" | "green" | "gray" | "red" | "amber";
const BADGE_BASE = "inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wide";
const BADGE_COLOR: Record<BadgeColor, string> = {
  brand: "bg-brand/10 text-[var(--c-brand-text)]",
  green: "bg-[var(--c-success-bg)] text-[var(--c-success-fg)]",
  gray: "bg-gray-100 text-gray-500",
  red: "bg-[var(--c-danger-bg)] text-[var(--c-danger-fg)]",
  amber: "bg-[var(--c-warning-bg)] text-[var(--c-warning-fg)]",
};
export function badgeClass(color: BadgeColor = "gray"): string {
  return `${BADGE_BASE} ${BADGE_COLOR[color]}`;
}

// ── Навігація (ab3: без плашки-пігулки, лише колір + display-шрифт; активний — помаранч) ──
const NAV_HEADER_BASE =
  "px-3 py-2 font-display text-lg font-semibold uppercase tracking-wide transition-colors duration-300";
/** Посилання верхнього меню шапки. */
export function headerNavClass(active: boolean): string {
  return active
    ? `${NAV_HEADER_BASE} text-[var(--c-brand-text)]`
    : `${NAV_HEADER_BASE} text-gray-600 hover:text-[var(--c-brand-text)]`;
}
/** Пункт «Адмінка» — завжди акцентований брендом; активний — яскравіший помаранч. */
export function headerAdminClass(active: boolean): string {
  return active
    ? `${NAV_HEADER_BASE} text-[var(--c-primary-hover)]`
    : `${NAV_HEADER_BASE} text-[var(--c-brand-text)] hover:text-[var(--c-primary-hover)]`;
}

const NAV_SUB_BASE =
  "inline-flex items-center justify-center px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-wide transition-colors duration-300";
/** Підпункт підменю адмінки. */
export function subNavClass(active: boolean): string {
  return active
    ? `${NAV_SUB_BASE} text-[var(--c-brand-text)]`
    : `${NAV_SUB_BASE} text-gray-700 hover:text-[var(--c-brand-text)]`;
}

// ── Токени (типографіка, поверхні, поля, таблиці, банери, розкладка) ──
export const ui = {
  // Типографіка. Заголовки — display-шрифт (Oswald) + ВЕРХНІЙ РЕГІСТР + єдиний колір --c-brand-text.
  // cardTitle НЕ робимо uppercase: там бувають назви ігор і позивні (власні назви).
  display: "font-display text-2xl font-bold uppercase tracking-tight text-[var(--c-brand-text)]",
  pageTitle: "font-display text-xl font-bold uppercase tracking-tight text-[var(--c-brand-text)]",
  sectionTitle: "font-display text-base font-semibold uppercase tracking-wide text-[var(--c-brand-text)]",
  cardTitle: "text-base font-semibold text-gray-900",
  body: "text-sm text-gray-700",
  bodyStrong: "text-sm font-medium text-gray-900",
  muted: "text-sm text-gray-500",
  label: "block text-sm font-medium text-gray-700",
  meta: "text-xs text-gray-500",

  // Поверхні — зрізані кути (.rx-chamfer); рамка/фон задаються в globals.css.
  card: "rx-chamfer p-5 text-gray-900",
  cardHover: "rx-chamfer rx-spotlight p-5 text-gray-900",
  panel: "bg-gray-100 px-3 py-2 text-sm text-gray-600",

  // Поля вводу (квадратні)
  input:
    "w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
  inputSm:
    "border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 placeholder-gray-400 " +
    "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",

  // Таблиці / списки (квадратні)
  tableWrap: "overflow-x-auto overflow-hidden border border-gray-200 bg-white",
  // Обгортка таблиці зі зрізаними кутами (як картка «Найближча гра»).
  // Скрол виносимо на ВНУТРІШНІЙ div, бо overflow тут обрізав би рамку-підкладку (::before).
  tableWrapCut: "rx-chamfer",
  table: "w-full text-sm",
  thead: "bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500",
  // Стандартна висота рядка = 36px (h-9): БЕЗ вертикального паддінгу, вирівнювання по центру.
  // Так компактна кнопка btn(kind,"sm") (теж 36px) заповнює клітинку рівно, не роздуваючи рядок.
  th: "h-9 px-3 text-left align-middle",
  tbody: "divide-y divide-gray-200",
  td: "h-9 px-3 align-middle text-gray-700",

  // Банери (семантика з CSS-змінних — яскраві ab3, квадратні)
  alertOk: "bg-[var(--c-success-bg)] px-3 py-2 text-sm text-[var(--c-success-fg)]",
  alertErr: "bg-[var(--c-danger-bg)] px-3 py-2 text-sm text-[var(--c-danger-fg)]",
  alertWarn: "bg-[var(--c-warning-bg)] px-3 py-2 text-sm text-[var(--c-warning-fg)]",

  // Семантичний текст (дельти балів, статуси-підписи)
  posText: "text-[var(--c-success-fg)]",
  negText: "text-[var(--c-danger-fg)]",
  posDelta: "text-[var(--c-success-soft)]",
  negDelta: "text-[var(--c-danger-soft)]",

  // Розкладка
  pageStack: "space-y-6",
  listStack: "space-y-3",

  // ── Посилання / текст ──
  link: "text-[var(--c-brand-text)] hover:underline",
  warnText: "text-[var(--c-warning-fg)]",
  metaFaint: "text-xs text-gray-400",
  price: "text-sm font-semibold text-[var(--c-brand-text)]",
  wordmark: "rx-chamfer-fill [--cut:8px] inline-block bg-[var(--c-primary)] px-4 py-2 font-display text-lg font-extrabold uppercase leading-none tracking-wide text-black",
  emptyState: "border border-dashed border-gray-300 p-5 text-sm text-gray-500",

  // Ширини центрованих сторінок (ADR-0024): narrow=форма/діалог, prose=стаття/кабінет, wide=контент
  widthNarrow: "mx-auto w-full max-w-md",
  widthProse: "mx-auto w-full max-w-2xl",
  widthWide: "mx-auto w-full max-w-[66rem]",

  // Поля форм (квадратні)
  fieldLabel: "mb-1 block text-sm font-medium text-gray-700",
  legend: "px-1 text-xs font-semibold uppercase tracking-wide text-gray-500",
  fieldBox: "border border-gray-200 p-3",
  checkbox: "h-4 w-4 accent-brand",
  radio: "h-4 w-4 accent-brand",
  fileInput:
    "block w-full text-sm text-gray-700 file:mr-3 file:border-0 " +
    "file:bg-[var(--c-action-bg)] file:px-3 file:py-1.5 file:text-[var(--c-action-fg)] hover:file:bg-[var(--c-action-bg-hover)]",

  // Поверхні
  listCard: "divide-y divide-gray-100 border border-gray-200 bg-white",
  // Службовий кружечок (іконка успіху в модалці) — лишається КРУГЛИМ свідомо.
  successIconCircle:
    "flex items-center justify-center rounded-full bg-[var(--c-success-bg)] text-[var(--c-success-fg)]",

  // Іконкові / overlay / FAB кнопки
  iconBtn:
    "flex h-7 w-7 items-center justify-center text-gray-500 transition hover:bg-gray-200 " +
    "hover:text-gray-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
  overlayBtn:
    "bg-white/10 px-3 py-1.5 text-sm font-medium uppercase tracking-wide text-neutral-50 transition hover:bg-white/20",
  // Кругла overlay-іконка над фото — лишається КРУГЛОЮ свідомо.
  overlayIconBtn:
    "flex items-center justify-center rounded-full bg-white/10 text-neutral-50 transition hover:bg-white/20",
  // FAB (плаваюча кнопка баг-репорту) — лишається КРУГЛОЮ свідомо.
  fab:
    "fixed bottom-4 right-4 z-40 flex items-center rounded-full bg-neutral-100 text-neutral-900 shadow-lg " +
    "transition-colors hover:bg-neutral-200",
} as const;

// ── Хелпери статус→бейдж (ADR-0025). Колір пігулки; дефолт невідомого — gray. ──
// Текст пігулки локалізується окремо через st(lang, `gamest_*`/`regst_*`).
export function gameStatusBadge(status: string): string {
  const color: BadgeColor =
    status === "announced" || status === "registered"
      ? "green"
      : status === "cancelled" || status === "no_show"
        ? "red"
        : "gray";
  return badgeClass(color);
}
export function referralStatusBadge(status: string): string {
  const color: BadgeColor =
    status === "confirmed" || status === "passed"
      ? "green"
      : status === "rejected"
        ? "red"
        : status === "pending"
          ? "amber"
          : "gray";
  return badgeClass(color);
}
