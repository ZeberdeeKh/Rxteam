import type { ReactNode } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import { faq } from "@/lib/i18n";
import { REPLICA_TYPES } from "@/lib/replicas";

// Стилізований акордеон правил на нативному <details> (server-safe, без JS).
// Блоки: Правила гри · Ліміти потужності · Правила спілкування в Telegram.
// ДЖЕРЕЛО ПРАВДИ для тексту правил — settings.faq_<lang>, тобто рівно те саме,
// що бот віддає на /rules через getFaqText (lib/bot-texts.ts). Fallback — хардкод
// faq[] з lib/i18n. Адмін редагує в одному місці (Settings → Правила / FAQ) — і
// бот, і сайт оновлюються разом. Тактичний вигляд ab3: зрізані кути (.rx-chamfer),
// помаранчева акцент-смуга, заголовок display-шрифтом, spotlight-підсвітка на hover.
export default function RulesFaq({
  lang,
  settings,
}: {
  lang: Lang;
  settings: Record<string, string>;
}) {
  // Ліміти задаються per-replica у settings (limit_<code>_pl|uk); en → pl (як в анонсі).
  const ll: "pl" | "uk" = lang === "uk" ? "uk" : "pl";
  const limitRows = REPLICA_TYPES.map((t) => ({
    label: t[lang],
    val: settings[`limit_${t.code}_${ll}`]?.trim(),
  })).filter((r): r is { label: string; val: string } => !!r.val);

  // Той самий текст, що бот віддає на /rules. Бот-FAQ розділений лінією «━━━…»
  // на блоки: перший — правила гри, решта — правила гілок Telegram. Якщо
  // роздільника нема — увесь текст показуємо одним блоком «Правила гри».
  const faqText = settings[`faq_${lang}`]?.trim() || faq[lang];
  const parts = faqText
    .split(/\n*━{3,}\n*/)
    .map((s) => s.trim())
    .filter(Boolean);
  const gameText = parts[0] ?? faqText;
  const tgText = parts.slice(1).join("\n\n━━━━━━━━━━\n\n");

  const items: { key: string; q: string; body: ReactNode; defaultOpen?: boolean }[] = [
    {
      key: "game",
      q: "faq_game_q",
      defaultOpen: true,
      body: <p className={ANSWER}>{gameText}</p>,
    },
    {
      key: "limits",
      q: "faq_limits_q",
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
    },
  ];

  // Блок Telegram-правил — лише якщо в бот-тексті є друга частина (після роздільника).
  if (tgText) {
    items.push({
      key: "tg",
      q: "faq_tg_q",
      body: <p className={ANSWER}>{tgText}</p>,
    });
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
              {st(lang, it.q)}
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
