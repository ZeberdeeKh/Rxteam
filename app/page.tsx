import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getNextGame, getRanking } from "@/lib/site-data";
import { getAllSettings } from "@/lib/settings";
import { formatGameWhen } from "@/lib/games";
import { ui, buttonClass } from "@/components/ui";
import RankingTable from "@/components/site/RankingTable";
import SocialLinks from "@/components/site/SocialLinks";

// Лендінг (публічний, одна сторінка): герой + найближча гра + рейтинг + «Про нас» + соцмережі.
export default async function Home() {
  const lang = getServerLang();
  const [next, ranking, settings] = await Promise.all([
    getNextGame(),
    getRanking(10),
    getAllSettings(),
  ]);

  const countText = (() => {
    if (!next) return "";
    return next.capacity
      ? st(lang, "games_count_cap", { n: next.count, cap: next.capacity })
      : st(lang, "games_count", { n: next.count });
  })();

  return (
    <div className="space-y-10">
      {/* Герой */}
      <section className="max-w-2xl">
        <h1 className={ui.display}>{st(lang, "home_title")}</h1>
        <p className={`mt-3 ${ui.body}`}>{st(lang, "home_hero_sub")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/games" className={buttonClass("primary")}>
            {st(lang, "home_cta_games")}
          </Link>
          <a href="#ranking" className={buttonClass("secondary")}>
            {st(lang, "home_cta_ranking")}
          </a>
        </div>
      </section>

      {/* Найближча гра */}
      <section>
        <h2 className={ui.sectionTitle}>{st(lang, "home_next_title")}</h2>
        {next ? (
          <Link href="/games" className={`mt-3 block ${ui.cardHover}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={ui.cardTitle}>{next.title ?? "ASG"}</span>
              <span className={ui.muted}>{countText}</span>
            </div>
            <div className={`mt-2 ${ui.body}`}>
              📅 {formatGameWhen(next.gather_at ?? next.start_at, lang)}
            </div>
            <div className={ui.body}>
              📍 {next.location?.name ?? st(lang, "games_tbd_loc")}
            </div>
          </Link>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
            {st(lang, "home_next_none")}
          </p>
        )}
      </section>

      {/* Рейтинг (на лендінгу, замість окремої сторінки в меню) */}
      <section id="ranking" className="scroll-mt-20">
        <h2 className={ui.sectionTitle}>{st(lang, "ranking_title")}</h2>
        <p className={`mt-1 mb-3 ${ui.muted}`}>{st(lang, "ranking_intro")}</p>
        <RankingTable rows={ranking} lang={lang} />
        {ranking.length > 0 && <p className={`mt-2 ${ui.meta}`}>{st(lang, "ranking_note_top")}</p>}
      </section>

      {/* Про нас + соцмережі */}
      <section className="max-w-2xl">
        <h2 className={ui.sectionTitle}>{st(lang, "home_about_title")}</h2>
        <p className={`mt-3 leading-relaxed ${ui.body}`}>{st(lang, "home_about_body")}</p>
        <SocialLinks settings={settings} lang={lang} />
      </section>
    </div>
  );
}
