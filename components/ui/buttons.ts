// ─────────────────────────────────────────────────────────────────────────────
// Кнопки RX Team — ЄДИНЕ джерело стилів кнопок.
//
// УСІ кнопки сайту мають ОДИН і той самий вигляд: однаковий шрифт, розмір шрифту
// й висота. Змінюється ЛИШЕ ширина — залежно від довжини тексту. Розмірних
// варіантів (sm/md) НЕМАЄ. Єдина відмінність між кнопками — ТИП (колір):
//   • "action"  активна дія: створення / збереження / підтвердження (хакі = заголовки);
//   • "delete"  деструктивна дія: видалення / скасування (червоний).
//
// Не хардкодимо стилі кнопок по сторінках — завжди btn(kind) або <Button kind>.
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonKind = "action" | "delete";

// Спільна основа — однакова висота/шрифт/розмір шрифту для ВСІХ кнопок.
// Горизонтальний padding фіксований, тож ширина залежить тільки від тексту.
const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm " +
  "font-semibold uppercase tracking-wide shadow-sm transition disabled:opacity-50 " +
  "disabled:pointer-events-none focus:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-offset-1 focus-visible:ring-offset-white";

// Колір — єдина різниця між типами. «action» бере той самий хакі, що й заголовки/лого.
const BTN_KIND: Record<ButtonKind, string> = {
  action:
    "bg-[var(--c-action-bg)] text-[var(--c-action-fg)] hover:bg-[var(--c-action-bg-hover)] " +
    "focus-visible:ring-brand/50",
  delete:
    "bg-[var(--c-danger-solid)] text-neutral-50 hover:bg-[var(--c-danger-solid-hover)] " +
    "focus-visible:ring-[var(--c-danger-solid)]/50",
};

/** Клас для будь-якого «кнопкового» елемента (button / Link / a). */
export function btn(kind: ButtonKind = "action"): string {
  return `${BTN_BASE} ${BTN_KIND[kind]}`;
}
