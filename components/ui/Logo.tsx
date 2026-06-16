// Логотип RX Team. УСІ варіанти збережено тут — перемикання константою LOGO_VARIANT.
//   A — чіп «RX» зі зрізаними кутами + «TEAM» текстом поряд;
//   B — контурна плашка зі зрізами (помаранчева рамка + помаранчевий текст);
//   C — двоколірний напис без плашки («RX» помаранч, «TEAM» білий);
//   D — напис + помаранчева смужка зі зрізами під ним;
//   E — кутові дужки (HUD-рамка) навколо напису;
//   F — стек «RX» / «TEAM» (військовий патч);
//   G — плашка з насічками по боках (.rx-notch);
//   H — «RX // TEAM» з помаранчевими слешами;
//   I — вертикальна помаранчева смужка-акцент + напис.
// Рендериться всередині <Link href="/"> у шапці (app/layout.tsx). Серверний компонент.

type Variant = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

const LOGO_VARIANT: Variant = "E";

// Спільні класи тексту лого (display-шрифт Oswald, як меню/заголовки).
const TXT = "font-display text-3xl font-extrabold uppercase leading-none tracking-wide";

export default function Logo() {
  switch (LOGO_VARIANT) {
    // B — контурна плашка: зовнішній помаранчевий шар (рамка 2px) + внутрішній «прозорий».
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

    // D — напис + помаранчева смужка зі зрізами під ним.
    case "D":
      return (
        <span className="inline-flex flex-col items-start gap-1.5">
          <span className={`text-[var(--c-brand-text)] ${TXT}`}>RX&nbsp;Team</span>
          <span className="rx-chamfer-fill [--cut:2px] h-1 w-full bg-[var(--c-primary)]" aria-hidden="true" />
        </span>
      );

    // E — кутові дужки (HUD-рамка): помаранчеві куточки top-left + bottom-right навколо напису.
    case "E":
      return (
        <span className="relative inline-block px-3 py-2">
          <span className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2 border-[var(--c-primary)]" aria-hidden="true" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2 border-[var(--c-primary)]" aria-hidden="true" />
          <span className={`text-[var(--c-brand-text)] ${TXT}`}>RX&nbsp;Team</span>
        </span>
      );

    // F — стек «RX» (помаранч) над «TEAM» (білий, дрібніший, широкий трекінг). Військовий патч.
    case "F":
      return (
        <span className="inline-flex flex-col items-start leading-none">
          <span className="font-display text-3xl font-extrabold uppercase leading-none text-[var(--c-primary)]">RX</span>
          <span className="mt-1 font-display text-sm font-bold uppercase leading-none tracking-[0.35em] text-white">Team</span>
        </span>
      );

    // G — плашка з насічками по боках (.rx-notch), помаранчева заливка, чорний текст.
    case "G":
      return (
        <span className={`rx-notch inline-block bg-[var(--c-primary)] px-5 py-2 text-black ${TXT}`}>
          RX&nbsp;Team
        </span>
      );

    // H — «RX // TEAM»: текст білий, слеші помаранчеві.
    case "H":
      return (
        <span className={TXT}>
          <span className="text-white">RX</span>
          <span className="text-[var(--c-primary)]">&nbsp;//&nbsp;</span>
          <span className="text-white">Team</span>
        </span>
      );

    // I — вертикальна помаранчева смужка-акцент (зі зрізами) + напис.
    case "I":
      return (
        <span className="inline-flex items-center gap-2.5">
          <span className="rx-chamfer-fill [--cut:3px] inline-block h-6 w-1.5 bg-[var(--c-primary)]" aria-hidden="true" />
          <span className={`text-[var(--c-brand-text)] ${TXT}`}>RX&nbsp;Team</span>
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
