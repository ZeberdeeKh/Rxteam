import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { ui, Collapsible, Reveal } from "@/components/ui";

// /faq — публічні правила груп та гілок Telegram. Дзеркало бот-команди /rules. Видно всім.
export default function FaqPage() {
  const lang = getServerLang();

  const items: { key: string; defaultOpen?: boolean }[] = [
    { key: "newcomer", defaultOpen: true },
    { key: "flood" },
    { key: "market" },
    { key: "announce" },
    { key: "media" },
  ];

  return (
    <div className={`${ui.widthProse} ${ui.pageStack}`}>
      <header className="space-y-2">
        <h1 className={ui.pageTitle}>{st(lang, "faq_title")}</h1>
        <p className={ui.body}>{st(lang, "faq_intro")}</p>
      </header>

      <div className="space-y-3">
        {items.map((it, i) => (
          <Reveal key={it.key} delay={i * 60}>
            <Collapsible
              summary={<span className={ui.cardTitle}>{st(lang, `faq_${it.key}_q`)}</span>}
              defaultOpen={it.defaultOpen}
            >
              <p className={`${ui.body} whitespace-pre-line`}>{st(lang, `faq_${it.key}_a`)}</p>
            </Collapsible>
          </Reveal>
        ))}
      </div>

      <p className={ui.meta}>{st(lang, "faq_footnote")}</p>
    </div>
  );
}
