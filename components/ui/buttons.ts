// ─────────────────────────────────────────────────────────────────────────────
// Кнопки RX Team — ЄДИНЕ джерело стилів кнопок.
//
// УСІ кнопки сайту мають ОДИН загальний стиль (форма, радіус, типографіка,
// uppercase, фокус-обведення, поведінка при disabled). Дозволені відмінності:
//   • РОЗМІР  — "sm" | "md";
//   • ТИП (колір) — лише ДВА:
//       – "action"  активна дія: створення / збереження / підтвердження (бренд-хакі);
//       – "delete"  деструктивна дія: видалення / скасування (червоний).
//
// Інших типів кнопок не існує. Не хардкодимо стилі кнопок по сторінках —
// завжди btn(kind, size) або <Button kind size>.
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonKind = "action" | "delete";
export type ButtonSize = "sm" | "md";

// Спільна основа — однакова для обох типів (відрізняє лише колір нижче).
const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold uppercase tracking-wide " +
  "shadow-sm transition disabled:opacity-50 disabled:pointer-events-none " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white";

// Колір — єдина різниця між типами. Обидва суцільні, світлий текст.
const BTN_KIND: Record<ButtonKind, string> = {
  action: "bg-brand text-neutral-50 hover:bg-brand-dark focus-visible:ring-brand/50",
  delete:
    "bg-[var(--c-danger-solid)] text-neutral-50 hover:bg-[var(--c-danger-solid-hover)] " +
    "focus-visible:ring-[var(--c-danger-solid)]/50",
};

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

/** Клас для будь-якого «кнопкового» елемента (button / Link / a). */
export function btn(kind: ButtonKind = "action", size: ButtonSize = "md"): string {
  return `${BTN_BASE} ${BTN_KIND[kind]} ${BTN_SIZE[size]}`;
}
