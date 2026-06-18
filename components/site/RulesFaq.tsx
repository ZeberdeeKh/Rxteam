import type { ReactNode } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import { faq } from "@/lib/i18n";
import { REPLICA_TYPES } from "@/lib/replicas";
import type { SiteFaqItem } from "@/lib/site-data";

// Стилізований акордеон правил на нативному <details> (server-safe, без JS).
// ДЖЕРЕЛО для сайту — структурований FAQ-модуль (таблиця faq_items, /admin/faq):
// список пар «питання + відповідь». Поки faq_items порожня (міграція ще не виконана)
// — graceful fallback на старий текст settings.faq_<lang> (те саме, що бот /rules),
// розбитий лінією «━━━» на блоки правил гри й гілок Telegram. Блок «Ліміти потужності»
// завжди окремий — це структуровані per-replica дані з settings (limit_<code>_<lang>).
// Тактичний вигляд ab3: зрізані кути (.rx-chamfer), помаранчева акцент-смуга,
// заголовок display-шрифтом, spotlight-підсвітка на hover.

type Item = { key: string; title: string; body: ReactNode; defaultOpen?: boolean };

// Текст FAQ-рядка мовою сайту з безпечним відкотом (порожнє поле → інша мова).
function pickFaq(it: SiteFaqItem, kind: "question" | "answer", lang: Lang): string {
  const uk = kind === "question" ? it.question_uk : it.answer_uk;
  const pl = kind === "question" ? it.question_pl : it.answer_pl;
  const en = kind === "question" ? it.question_en : it.answer_en;
  if (lang === "uk") return uk || pl || en || "";
  if (lang === "pl") return pl || uk || en || "";
  return en || pl || uk || "";
}

export default function RulesFaq({
  lang,
  settings,
  faqItems = [],
}: {
  lang: Lang;
  settings: Record<string, string>;
  faqItems?: SiteFaqItem[];
}) {
  // Ліміти задаються per-replica у settings (limit_<code>_pl|uk); en → pl (як в анонсі).
  const ll: "pl" | "uk" = lang === "uk" ? "uk" : "pl";
  const limitRows = REPLICA_TYPES.map((t) => ({
    label: t[lang],
    val: settings[`limit_${t.code}_${ll}`]?.trim(),
  })).filter((r): r is { label: string; val: string } => !!r.val);

  const limitsItem: Item = {
    key: "limits",
    title: st(lang, "faq_limits_q"),
    body: (
      <div className="space-y-2">
        <p className={ANSWER}>{st(lang, "faq_limits_intro")}</p>
        {limitRows.length > 0 ? (
          <ul className="space-y-1 text-sm leading-relaxed text-gray-700">
            {limitRows.map((r) => (
              <li key={r.label}>
                <span className="font-semibold text-gray-900">{r.label}:</span> {r.val}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">{st(lang, "faq_limits_none")}</p>
        )}
      </div>
    ),
  };

  let items: Item[];
  if (faqItems.length > 0) {
    // Пріоритет — структурований FAQ-модуль. Перше питання розкрите. Ліміти — в кінці.
    const cards: Item[] = faqItems.map((it, i) => ({
      key: `faq-${i}`,
      title: pickFaq(it, "question", lang),
      body: <p className={ANSWER}>{pickFaq(it, "answer", lang)}</p>,
      defaultOpen: i === 0,
    }));
    items = [...cards, limitsItem];
  } else {
    // Fallback: старий текст settings.faq_<lang>, розбитий «━━━» на гру / гілки Telegram.
    const faqText = settings[`faq_${lang}`]?.trim() || faq[lang];
    const parts = faqText
      .split(/\n*━{3,}\n*/)
      .map((s) => s.trim())
      .filter(Boolean);
    const gameText = parts[0] ?? faqText;
    const tgText = parts.slice(1).join("\n\n━━━━━━━━━━\n\n");
    items = [
      {
        key: "game",
        title: st(lang, "faq_game_q"),
        defaultOpen: true,
        body: <p className={ANSWER}>{gameText}</p>,
      },
      limitsItem,
    ];
    if (tgText) {
      items.push({ key: "tg", title: st(lang, "faq_tg_q"), body: <p className={ANSWER}>{tgText}</p> });
    }
  }

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <details
          key={it.key}
          open={it.defaultOpen}
          className="rx-collapse rx-chamfer rx-spotlight [--cut:10px] [--spotlight-size:520px]"
        >
          <summary className="flex cursor-pointer select-none items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--c-gray-50)]">
            <span className="h-5 w-1 shrink-0 bg-[var(--c-primary)]" aria-hidden />
            <span className="min-w-0 flex-1 font-display text-base font-semibold uppercase tracking-wide text-gray-900">
              {it.title}
            </span>
            <svg
              className="rx-chevron h-4 w-4 shrink-0 text-[var(--c-primary)] transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="border-t border-gray-200 px-5 pb-4 pt-3">{it.body}</div>
        </details>
      ))}
    </div>
  );
}

const ANSWER = "whitespace-pre-line text-sm leading-relaxed text-gray-700";
