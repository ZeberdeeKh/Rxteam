// ─────────────────────────────────────────────────────────────────────────────
// Дизайн-система RX Team — ЄДИНЕ джерело стилів.
// Усі кнопки, картки, поля, таблиці, бейджі й типографіка беруться звідси,
// щоб вигляд був однаковий на всьому сайті. Не хардкодимо класи по сторінках.
//
// Кольори працюють у світлій і темній темі автоматично:
//   • gray-* / white  — перемикаються (CSS-змінні, див. globals.css);
//   • brand-*         — хакі, НЕ перемикається;
//   • neutral-50      — фіксований світлий (текст на кольорових кнопках);
//   • green/red/amber — семантичні банери/бейджі, НЕ перемикаються.
//
// Типографіка (Montserrat). Дозволені РІВНІ — лише ці. Інших розмірів не вводимо:
//   display 3xl · pageTitle 2xl · sectionTitle lg · cardTitle base · body sm · meta xs
// ─────────────────────────────────────────────────────────────────────────────

// Кнопки винесено в окремий модуль — див. ./buttons.ts (рівно 2 типи: action / delete).

// ── Бейджі (pill) ──
// Семантичні кольори (green/red/amber) беруться з CSS-змінних — приглушуються на темній темі.
export type BadgeColor = "brand" | "green" | "gray" | "red" | "amber";
const BADGE_BASE = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
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

// ── Навігація (активний стан — підсвічування поточного пункту) ──
// Пункти меню — у ВЕРХНЬОМУ РЕГІСТРІ (як кнопки й заголовки).
const NAV_HEADER_BASE = "rounded-md px-2.5 py-1 text-xs uppercase tracking-wide transition";
/** Посилання верхнього меню шапки. */
export function headerNavClass(active: boolean): string {
  return active
    ? `${NAV_HEADER_BASE} bg-brand/10 text-[var(--c-brand-text)] font-semibold`
    : `${NAV_HEADER_BASE} text-gray-600 hover:bg-brand/10 hover:text-[var(--c-brand-text)]`;
}
/** Пункт «Адмінка» — завжди акцентований брендом; активний — підсвічений. */
export function headerAdminClass(active: boolean): string {
  return active
    ? `${NAV_HEADER_BASE} bg-brand/10 text-[var(--c-brand-text)] font-semibold`
    : `${NAV_HEADER_BASE} text-[var(--c-brand-text)] font-medium hover:bg-brand/10`;
}

const NAV_SUB_BASE =
  "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition";
/** Підпункт підменю адмінки. */
export function subNavClass(active: boolean): string {
  return active
    ? `${NAV_SUB_BASE} bg-brand/10 text-[var(--c-brand-text)] font-semibold`
    : `${NAV_SUB_BASE} text-gray-700 hover:bg-brand/10 hover:text-[var(--c-brand-text)]`;
}

// ── Токени (типографіка, поверхні, поля, таблиці, банери, розкладка) ──
export const ui = {
  // Типографіка. Заголовки — ВЕРХНІЙ РЕГІСТР (uppercase) + єдиний колір --c-brand-text
  // (той самий, що й логотип). Розміри навмисно стримані. Див. docs/DESIGN_SYSTEM.md.
  // cardTitle НЕ робимо uppercase: там бувають назви ігор і позивні (власні назви).
  display: "text-2xl font-bold uppercase tracking-tight text-[var(--c-brand-text)]",
  pageTitle: "text-xl font-bold uppercase tracking-tight text-[var(--c-brand-text)]",
  sectionTitle: "text-base font-semibold uppercase tracking-wide text-[var(--c-brand-text)]",
  cardTitle: "text-base font-semibold text-gray-900",
  body: "text-sm text-gray-700",
  bodyStrong: "text-sm font-medium text-gray-900",
  muted: "text-sm text-gray-500",
  label: "block text-sm font-medium text-gray-700",
  meta: "text-xs text-gray-500",

  // Поверхні
  card: "rounded-lg border border-gray-200 bg-white p-5",
  cardHover: "rounded-lg border border-gray-200 bg-white p-5 transition hover:border-brand",
  panel: "rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600",

  // Поля вводу
  input:
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
  inputSm:
    "rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 placeholder-gray-400 " +
    "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",

  // Таблиці / списки
  tableWrap: "overflow-x-auto overflow-hidden rounded-lg border border-gray-200 bg-white",
  table: "w-full text-sm",
  thead: "bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500",
  th: "px-3 py-2 text-left",
  tbody: "divide-y divide-gray-200",
  td: "px-3 py-2 text-gray-700",

  // Банери (семантика з CSS-змінних — приглушені на темній темі)
  alertOk: "rounded-md bg-[var(--c-success-bg)] px-3 py-2 text-sm text-[var(--c-success-fg)]",
  alertErr: "rounded-md bg-[var(--c-danger-bg)] px-3 py-2 text-sm text-[var(--c-danger-fg)]",
  alertWarn: "rounded-md bg-[var(--c-warning-bg)] px-3 py-2 text-sm text-[var(--c-warning-fg)]",

  // Семантичний текст (дельти балів, статуси-підписи)
  posText: "text-[var(--c-success-fg)]",
  negText: "text-[var(--c-danger-fg)]",
  posDelta: "text-[var(--c-success-soft)]",
  negDelta: "text-[var(--c-danger-soft)]",

  // Розкладка
  pageStack: "space-y-6",
  listStack: "space-y-3",

  // ── Додано рефакторингом (ADR-0023 / 0025 / 0026) ──
  // Посилання / текст
  link: "text-[var(--c-brand-text)] hover:underline",
  warnText: "text-[var(--c-warning-fg)]",
  metaFaint: "text-xs text-gray-400",
  price: "text-sm font-semibold text-[var(--c-brand-text)]",
  wordmark: "text-xl font-extrabold uppercase tracking-wide text-[var(--c-brand-text)]",
  emptyState: "rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500",

  // Ширини центрованих сторінок (ADR-0024): narrow=форма/діалог, prose=стаття/кабінет, wide=контент
  widthNarrow: "mx-auto w-full max-w-md",
  widthProse: "mx-auto w-full max-w-2xl",
  widthWide: "mx-auto w-full max-w-[66rem]",

  // Поля форм
  fieldLabel: "mb-1 block text-sm font-medium text-gray-700",
  legend: "px-1 text-xs font-semibold uppercase tracking-wide text-gray-500",
  fieldBox: "rounded-md border border-gray-200 p-3",
  checkbox: "h-4 w-4 accent-brand",
  radio: "h-4 w-4 accent-brand",
  fileInput:
    "block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 " +
    "file:bg-[var(--c-action-bg)] file:px-3 file:py-1.5 file:text-[var(--c-action-fg)] hover:file:bg-[var(--c-action-bg-hover)]",

  // Поверхні
  listCard: "divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white",
  successIconCircle:
    "flex items-center justify-center rounded-full bg-[var(--c-success-bg)] text-[var(--c-success-fg)]",

  // Іконкові / overlay / FAB кнопки
  iconBtn:
    "flex h-7 w-7 items-center justify-center rounded text-gray-500 transition hover:bg-gray-200 " +
    "hover:text-gray-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
  overlayBtn:
    "rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium uppercase tracking-wide text-neutral-50 transition hover:bg-white/20",
  overlayIconBtn:
    "flex items-center justify-center rounded-full bg-white/10 text-neutral-50 transition hover:bg-white/20",
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
