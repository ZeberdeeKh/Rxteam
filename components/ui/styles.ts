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
  brand: "bg-brand/10 text-brand-dark",
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
const NAV_HEADER_BASE = "rounded-md px-2.5 py-1.5 text-sm uppercase tracking-wide transition";
/** Посилання верхнього меню шапки. */
export function headerNavClass(active: boolean): string {
  return active
    ? `${NAV_HEADER_BASE} bg-brand/10 text-brand font-semibold`
    : `${NAV_HEADER_BASE} text-gray-600 hover:bg-brand/10 hover:text-brand`;
}
/** Пункт «Адмінка» — завжди акцентований брендом; активний — підсвічений. */
export function headerAdminClass(active: boolean): string {
  return active
    ? `${NAV_HEADER_BASE} bg-brand/10 text-brand font-semibold`
    : `${NAV_HEADER_BASE} text-brand font-medium hover:bg-brand/10`;
}

const NAV_SUB_BASE =
  "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition";
/** Підпункт підменю адмінки. */
export function subNavClass(active: boolean): string {
  return active
    ? `${NAV_SUB_BASE} bg-brand/10 text-brand font-semibold`
    : `${NAV_SUB_BASE} text-gray-700 hover:bg-brand/10 hover:text-brand`;
}

// ── Токени (типографіка, поверхні, поля, таблиці, банери, розкладка) ──
export const ui = {
  // Типографіка. Заголовки — ВЕРХНІЙ РЕГІСТР (uppercase) на всьому сайті.
  // cardTitle НЕ робимо uppercase: там бувають назви ігор і позивні (власні назви).
  display: "text-3xl font-bold uppercase tracking-tight text-brand-dark",
  pageTitle: "text-2xl font-bold uppercase tracking-tight text-brand-dark",
  sectionTitle: "text-lg font-semibold uppercase tracking-wide text-brand-dark",
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
  tableWrap: "overflow-hidden rounded-lg border border-gray-200",
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
} as const;
