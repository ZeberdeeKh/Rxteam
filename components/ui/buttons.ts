// ─────────────────────────────────────────────────────────────────────────────
// Кнопки RX Team — ЄДИНЕ джерело стилів кнопок. Стиль ab3.army:
// КВАДРАТНІ (rounded-none), ПЛОСКІ (shadow-none), UPPERCASE, шрифт display (Oswald),
// рамка 2px. Однакова висота для всіх; ширина залежить лише від тексту.
//
// Типи (ТІЛЬКИ колір/заливка різні):
//   • "outline"  дефолт-стиль ab3: прозорий фон + помаранчева рамка, ховер — яскравіший помаранч;
//   • "action"   головна CTA: SOLID помаранч, чорний текст (створення / збереження / підтвердження);
//   • "delete"   деструктив: SOLID червоний;
//   • "ghost"    тиха другорядна дія (cancel): без рамки/заливки, ховер — помаранч.
//
// Опційна трейлінг-стрілка: додай клас `btn-arrow` (<Button className="btn-arrow">).
// Не хардкодимо стилі кнопок по сторінках — завжди btn(kind) або <Button kind>.
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonKind = "outline" | "action" | "delete" | "ghost";

// Спільна основа: квадрат, плоско, uppercase, display-шрифт, рамка 2px, однакова висота.
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-none border-2 px-5 py-2.5 md:py-3 " +
  "font-display text-xs font-bold uppercase leading-none tracking-wide shadow-none " +
  "transition-[color,background-color,border-color] duration-300 ease-in-out md:text-sm " +
  "disabled:opacity-50 disabled:pointer-events-none focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-white)]";

// Колір/заливка — єдина різниця між типами.
const BTN_KIND: Record<ButtonKind, string> = {
  // Дефолт ab3: прозорий + помаранчева рамка → ховер яскравіший помаранч.
  outline:
    "border-[var(--c-primary)] bg-transparent text-[var(--c-primary)] " +
    "hover:border-[var(--c-primary-hover)] hover:text-[var(--c-primary-hover)]",
  // Головна CTA: SOLID помаранч, чорний текст.
  action:
    "border-[var(--c-primary)] bg-[var(--c-primary)] text-[var(--c-primary-fg)] " +
    "hover:border-[var(--c-primary-hover)] hover:bg-[var(--c-primary-hover)]",
  // Деструктив: SOLID червоний, чорний текст.
  delete:
    "border-[var(--c-danger-solid)] bg-[var(--c-danger-solid)] text-black " +
    "hover:border-[var(--c-danger-solid-hover)] hover:bg-[var(--c-danger-solid-hover)]",
  // Тиха другорядна дія: без рамки/заливки, ховер — помаранч.
  ghost:
    "border-transparent bg-transparent text-gray-600 hover:text-[var(--c-primary)]",
};

/** Клас для будь-якого «кнопкового» елемента (button / Link / a). */
export function btn(kind: ButtonKind = "action"): string {
  return `${BTN_BASE} ${BTN_KIND[kind]}`;
}
