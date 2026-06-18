import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import {
  getNextGame,
  getRankingWithAchievements,
  getGalleryPhotos,
  getMarketplaceTeaser,
} from "@/lib/site-data";
import { getAllSettings } from "@/lib/settings";
import { formatGameWhen, buildLimits } from "@/lib/games";
import { ui, GLYPH, Reveal, btn } from "@/components/ui";
import RankingTable from "@/components/site/RankingTable";
import SocialLinks from "@/components/site/SocialLinks";
import GalleryGrid from "@/components/site/GalleryGrid";
import ListingCarousel from "@/components/site/ListingCarousel";
import RulesFaq from "@/components/site/RulesFaq";

// Лендінг (публічний, одна сторінка): «Про нас» + галерея + герой + найближча гра + рейтинг + соцмережі (внизу).
// Кожен модуль випливає при прокручуванні вниз (Reveal, scroll-reveal у дусі ab3).
export default async function Home() {
  const lang = getServerLang();
  const [next, ranking, settings, galleryPhotos, market] = await Promise.all([
    getNextGame(),
    getRankingWithAchievements(10),
    getAllSettings(),
    getGalleryPhotos(60),
    getMarketplaceTeaser(7),
  ]);
  const showGallery = settings.feature_gallery !== "false" && galleryPhotos.length > 0;
  const showMarket = settings.feature_marketplace !== "false" && market.length > 0;

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
      {/* Про нас (перший модуль на сторінці) */}
      <Reveal>
        <section>
          <h2 className={ui.sectionTitle}>{st(lang, "home_about_title")}</h2>
          <p className={`mt-3 leading-relaxed ${ui.body}`}>{st(lang, "home_about_body")}</p>
        </section>
      </Reveal>

      {/* Галерея (мозаїка, без заголовка/підпису) */}
      {showGallery && (
        <Reveal>
          <section>
            <GalleryGrid
              photos={galleryPhotos}
              closeLabel={st(lang, "gallery_close")}
              prevLabel={st(lang, "gallery_prev")}
              nextLabel={st(lang, "gallery_next")}
            />
          </section>
        </Reveal>
      )}

      {/* Найближча гра */}
      <Reveal>
        <section>
          <h2 className={ui.sectionTitle}>{st(lang, "home_next_title")}</h2>
          {next ? (
            <div className={`mt-3 ${ui.card}`}>
              <div className="flex items-baseline justify-between gap-3">
                <Link href="/games" className={`${ui.cardTitle} hover:text-[var(--c-brand-text)]`}>
                  {next.title ?? "ASG"}
                </Link>
                {next.showCount && <span className={`shrink-0 ${ui.muted}`}>{countText}</span>}
              </div>
              <div className={`mt-2 ${ui.body}`}>
                {GLYPH.date} {formatGameWhen(next.gather_at ?? next.start_at, lang)}
              </div>
              <div className={ui.body}>
                {GLYPH.place} {next.location?.name ?? st(lang, "games_tbd_loc")}
                {next.location?.map_url && (
                  <>
                    {" · "}
                    <a
                      href={next.location.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={ui.link}
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

              <Link href="/games" className={`mt-3 inline-block ${ui.link}`}>
                {st(lang, "home_cta_games")} →
              </Link>
            </div>
          ) : (
            <p className={`mt-3 ${ui.emptyState}`}>{st(lang, "home_next_none")}</p>
          )}
        </section>
      </Reveal>

      {/* Барахолка — тізер: ряд повноцінних карток (з лайтбоксом/каруселлю) + кнопка «дивитись більше» */}
      {showMarket && (
        <Reveal>
          <section>
            <h2 className={ui.sectionTitle}>{st(lang, "nav_marketplace")}</h2>
            <div className="mt-3">
              <ListingCarousel listings={market} lang={lang} />
            </div>
            <div className="mt-4 text-center">
              <Link href="/marketplace" className={btn("outline")}>
                {st(lang, "home_cta_marketplace")} →
              </Link>
            </div>
          </section>
        </Reveal>
      )}

      {/* Рейтинг (на лендінгу, замість окремої сторінки в меню) */}
      <Reveal>
        <section id="ranking" className="scroll-mt-20">
          <h2 className={ui.sectionTitle}>{st(lang, "ranking_title")}</h2>
          <p className={`mt-1 mb-3 ${ui.muted}`}>{st(lang, "ranking_intro")}</p>
          <RankingTable rows={ranking} lang={lang} />
        </section>
      </Reveal>

      {/* Правила / FAQ (дзеркало бот-команди /rules) — перед соцмережами */}
      <Reveal>
        <section id="rules" className="scroll-mt-20">
          <h2 className={ui.sectionTitle}>{st(lang, "faq_title")}</h2>
          <p className={`mt-1 mb-3 ${ui.muted}`}>{st(lang, "faq_intro")}</p>
          <RulesFaq lang={lang} />
          <p className={`mt-3 ${ui.metaFaint}`}>{st(lang, "faq_footnote")}</p>
        </section>
      </Reveal>

      {/* Соцмережі (окремий модуль, найнижче на сторінці) */}
      <Reveal>
        <section>
          <h2 className={ui.sectionTitle}>{st(lang, "home_social_title")}</h2>
          <SocialLinks settings={settings} lang={lang} />
        </section>
      </Reveal>
    </div>
  );
}
