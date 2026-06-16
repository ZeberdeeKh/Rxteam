// Логотип RX Team. УСІ запропоновані варіанти збережено тут — перемикання однією
// константою LOGO_VARIANT (пробуємо, не втрачаючи інші):
//   A — чіп «RX» зі зрізаними кутами + «TEAM» текстом поряд (активний);
//   B — контурна плашка зі зрізами (помаранчева рамка + помаранчевий текст, фон як шапка);
//   C — двоколірний напис без плашки («RX» помаранч, «TEAM» білий);
//   D — напис + помаранчева смужка зі зрізами під ним.
// Рендериться всередині <Link href="/"> у шапці (app/layout.tsx). Серверний компонент.

type Variant = "A" | "B" | "C" | "D";

const LOGO_VARIANT: Variant = "B";

// Спільні класи тексту лого (display-шрифт Oswald, як меню/заголовки).
const TXT = "font-display text-lg font-extrabold uppercase leading-none tracking-wide";

export default function Logo() {
  switch (LOGO_VARIANT) {
    // B — контурна плашка: зовнішній помаранчевий шар (рамка 2px) + внутрішній «прозорий»
    // (колір шапки) шар, обидва зі зрізами. Працює на непрозорому тлі шапки.
    case "B":
      return (
        <span className="rx-chamfer-fill [--cut:8px] inline-block bg-[var(--c-primary)] p-[2px]">
          <span className={`rx-chamfer-fill [--cut:7px] block bg-[var(--c-white)] px-4 py-2 text-[var(--c-brand-text)] ${TXT}`}>
            RX&nbsp;Team
          </span>
        </span>
      );

    // C — двоколірний напис без плашки.
    case "C":
      return (
        <span className={TXT}>
          <span className="text-[var(--c-primary)]">RX</span>
          <span className="text-white">&nbsp;Team</span>
        </span>
      );

    // D — напис + помаранчева смужка зі зрізами під ним (ширина = ширина напису).
    case "D":
      return (
        <span className="inline-flex flex-col items-start gap-1.5">
          <span className={`text-[var(--c-brand-text)] ${TXT}`}>RX&nbsp;Team</span>
          <span className="rx-chamfer-fill [--cut:2px] h-1 w-full bg-[var(--c-primary)]" aria-hidden="true" />
        </span>
      );

    // A — чіп «RX» (помаранч, зрізані кути, чорний текст) + «TEAM» помаранчевим текстом.
    case "A":
    default:
      return (
        <span className="inline-flex items-center gap-2">
          <span className={`rx-chamfer-fill [--cut:6px] inline-block bg-[var(--c-primary)] px-2.5 py-1.5 text-black ${TXT}`}>
            RX
          </span>
          <span className={`text-[var(--c-brand-text)] ${TXT}`}>Team</span>
        </span>
      );
  }
}
