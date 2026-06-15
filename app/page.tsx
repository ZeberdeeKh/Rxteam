import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getNextGame, getRanking, getGalleryPhotos } from "@/lib/site-data";
import { getAllSettings } from "@/lib/settings";
import { formatGameWhen, buildLimits } from "@/lib/games";
import { ui } from "@/components/ui";
import RankingTable from "@/components/site/RankingTable";
import SocialLinks from "@/components/site/SocialLinks";
import GalleryGrid from "@/components/site/GalleryGrid";

// Лендінг (публічний, одна сторінка): герой + найближча гра + рейтинг + «Про нас» + соцмережі.
export default async function Home() {
  const lang = getServerLang();
  const [next, ranking, settings, galleryPhotos] = await Promise.all([
    getNextGame(),
    getRanking(10),
    getAllSettings(),
    getGalleryPhotos(12),
  ]);
  const showGallery = settings.feature_gallery !== "false" && galleryPhotos.length > 0;

  const countText = (() => {
    if (!next) return "";
    return next.capacity
      ? st(lang, "games_count_cap", { n: next.count, cap: next.capacity })
      : st(lang, "games_count", { n: next.count });
  })();

  // Короткий тізер найближчої гри: сценарій + ліміти потрібною мовою (en → pl, як в анонсі).
  const ll: "pl" | "uk" = lang === "uk" ? "uk" : "pl";
  const scenario = next
    ? ll === "uk"
      ? next.scenario_uk ?? next.scenario_pl
      : next.scenario_pl ?? next.scenario_uk
    : null;
  const limits = next?.limits ? buildLimits(ll, next.limits, settings) : null;

  return (
    <div className="space-y-10">
      {/* Галерея (перший модуль на сторінці; випадкова добірка фото) */}
      {showGallery && (
        <section>
          <h2 className={ui.sectionTitle}>{st(lang, "gallery_title")}</h2>
          <p className={`mt-1 mb-3 ${ui.muted}`}>{st(lang, "gallery_intro")}</p>
          <GalleryGrid photos={galleryPhotos} closeLabel={st(lang, "gallery_close")} />
        </section>
      )}

      {/* Герой */}
      <section>
        <p className={ui.body}>{st(lang, "home_hero_sub")}</p>
      </section>

      {/* Найближча гра */}
      <section>
        <h2 className={ui.sectionTitle}>{st(lang, "home_next_title")}</h2>
        {next ? (
          <div className={`mt-3 ${ui.card}`}>
            <div className="flex items-baseline justify-between gap-3">
              <Link href="/games" className={`${ui.cardTitle} hover:text-brand`}>
                {next.title ?? "ASG"}
              </Link>
              <span className={`shrink-0 ${ui.muted}`}>{countText}</span>
            </div>
            <div className={`mt-2 ${ui.body}`}>
              📅 {formatGameWhen(next.gather_at ?? next.start_at, lang)}
            </div>
            <div className={ui.body}>
              📍 {next.location?.name ?? st(lang, "games_tbd_loc")}
              {next.location?.map_url && (
                <>
                  {" · "}
                  <a
                    href={next.location.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    {st(lang, "games_map")}
                  </a>
                </>
              )}
            </div>

            {(scenario || limits) && (
              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                {scenario && <p className={`whitespace-pre-line ${ui.body}`}>{scenario}</p>}
                {limits && <p className={`whitespace-pre-line ${ui.muted}`}>{limits}</p>}
              </div>
            )}

            <Link
              href="/games"
              className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
            >
              {st(lang, "home_cta_games")} →
            </Link>
          </div>
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
      <section>
        <h2 className={ui.sectionTitle}>{st(lang, "home_about_title")}</h2>
        <p className={`mt-3 leading-relaxed ${ui.body}`}>{st(lang, "home_about_body")}</p>
        <SocialLinks settings={settings} lang={lang} />
      </section>
    </div>
  );
}
