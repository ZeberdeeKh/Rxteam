import { st, type Lang } from "@/lib/site-i18n";

// Пункти правил (дзеркало бот-команди /rules). Перший — розгорнутий за замовчуванням.
const ITEMS: { key: string; defaultOpen?: boolean }[] = [
  { key: "newcomer", defaultOpen: true },
  { key: "flood" },
  { key: "market" },
  { key: "announce" },
  { key: "media" },
];

// Стилізований акордеон правил на нативному <details> (server-safe, без JS).
// Тактичний вигляд ab3: зрізані кути (.rx-chamfer), помаранчева акцент-смуга
// зліва від заголовка, spotlight-підсвітка на hover, заголовок display-шрифтом.
export default function RulesFaq({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-3">
      {ITEMS.map((it) => (
        <details
          key={it.key}
          open={it.defaultOpen}
          className="rx-collapse rx-chamfer rx-spotlight [--cut:10px] [--spotlight-size:520px]"
        >
          <summary className="flex cursor-pointer select-none items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--c-gray-50)]">
            <span className="h-5 w-1 shrink-0 bg-[var(--c-primary)]" aria-hidden />
            <span className="min-w-0 flex-1 font-display text-base font-semibold uppercase tracking-wide text-gray-900">
              {st(lang, `faq_${it.key}_q`)}
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
          <div className="border-t border-gray-200 px-5 pb-4 pt-3">
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {st(lang, `faq_${it.key}_a`)}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
