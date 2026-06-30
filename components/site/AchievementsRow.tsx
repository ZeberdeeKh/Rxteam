"use client";

import { useState } from "react";
import type { Lang } from "@/lib/site-i18n";
import type { RankAch } from "@/lib/site-data";
import { GLYPH } from "@/components/ui";

// Локалізована назва ачівки; fallback між мовами, далі — код.
function achTitle(a: RankAch, lang: Lang): string {
  return (
    (lang === "pl" ? a.title_pl : lang === "uk" ? a.title_uk : a.title_en) ??
    a.title_pl ??
    a.title_en ??
    a.title_uk ??
    a.code
  );
}

// Локалізований опис ачівки (за що дається); null, якщо опису немає.
function achDesc(a: RankAch, lang: Lang): string | null {
  return (lang === "pl" ? a.description_pl : lang === "uk" ? a.description_uk : a.description_en) ?? null;
}

// Підказка при наведенні (десктоп): назва + опис у новому рядку, або лише назва.
function achTip(a: RankAch, lang: Lang): string {
  const title = achTitle(a, lang);
  const desc = achDesc(a, lang);
  return desc ? `${title}\n${desc}` : title;
}

// Рядок здобутих ачівок (іконки 28px).
// Десктоп (md+): підказка через title= при наведенні — як було.
// Мобільний (тач, без hover): тап по іконці показує назву + опис у підписі під рядком.
export default function AchievementsRow({ list, lang }: { list: RankAch[]; lang: Lang }) {
  const [openCode, setOpenCode] = useState<string | null>(null);
  if (list.length === 0) return <span className="text-gray-300">—</span>;

  const selected = list.find((a) => a.code === openCode) ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1">
        {list.map((a) => {
          const title = achTitle(a, lang);
          const isOpen = a.code === openCode;
          return (
            <button
              key={a.code}
              type="button"
              title={achTip(a, lang)}
              aria-label={title}
              aria-expanded={isOpen}
              onClick={() => setOpenCode(isOpen ? null : a.code)}
              className={`shrink-0 leading-none transition-opacity ${isOpen ? "opacity-100" : "hover:opacity-80"}`}
            >
              {a.thumbnail_svg ? (
                // base64 data URL → інертний <img> (XSS-safe), див. Етап 20.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.thumbnail_svg} alt={title} className="h-7 w-7 object-contain" />
              ) : (
                <span className="text-lg leading-none">{GLYPH.rank}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Підпис лише на мобільному (< md): на десктопі за що ачівка видно через title= при наведенні. */}
      {selected && (
        <div className="mt-2 border-l-2 border-[var(--c-brand-text)] bg-gray-50 px-2.5 py-1.5 md:hidden">
          <p className="text-xs font-semibold text-gray-900">{achTitle(selected, lang)}</p>
          {achDesc(selected, lang) && (
            <p className="mt-0.5 text-xs leading-snug text-gray-600">{achDesc(selected, lang)}</p>
          )}
        </div>
      )}
    </div>
  );
}
