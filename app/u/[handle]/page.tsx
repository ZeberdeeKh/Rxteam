import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getAllSettings } from "@/lib/settings";
import { getPlayerCardByCallsign } from "@/lib/player-card";
import { getSessionContext } from "@/lib/session-player";
import { formatDateOnly } from "@/lib/games";
import { ui, GLYPH, badgeClass, btn } from "@/components/ui";
import AchievementsRow from "@/components/site/AchievementsRow";
import SocialLinks from "@/components/site/SocialLinks";

// Публічна картка гравця (/u/<позивний>). Ціль QR + кліку по імені в «Рейтингу» + шеринг профілю.
// Site-first: навколо картки — лише дії сайту (долучитися / ігри / головна) і соцмережі команди,
// жодного CTA «йди в бота» (не у всіх є Телеграм — сайт самодостатній).
export default async function PlayerCardPage({ params }: { params: { handle: string } }) {
  const lang = getServerLang();
  const handle = decodeURIComponent(params.handle);
  const [data, settings, session] = await Promise.all([
    getPlayerCardByCallsign(handle),
    getAllSettings(),
    getSessionContext(),
  ]);
  // Фіча вимкнена за замовчуванням: сторінка існує лише коли явно ввімкнено (feature_player_card="true").
  if (settings.feature_player_card !== "true") notFound();
  if (!data) notFound();

  const loggedIn = session.state !== "anon"; // зареєстрований глядач → інші CTA

  const stats: { label: string; value: string }[] = [
    { label: st(lang, "ranking_col_games"), value: String(data.gamesPlayed) },
    {
      label: st(lang, "card_reliability"),
      value: data.reliabilityPct === null ? "—" : `${data.reliabilityPct}%`,
    },
    { label: st(lang, "card_place"), value: data.place === null ? "—" : `#${data.place}` },
  ];

  const patchLine = data.hasPatch
    ? `🛡 ${data.patchAt ? st(lang, "card_patch_since", { date: formatDateOnly(data.patchAt) }) : st(lang, "card_patch")}`
    : null;
  const metaLine = [
    patchLine,
    data.registeredAt ? st(lang, "card_registered_since", { date: formatDateOnly(data.registeredAt) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={`${ui.widthProse} space-y-8`}>
      {/* Картка гравця */}
      <section className={`${ui.card} text-center`}>
        <div className={ui.metaFaint}>RX TEAM</div>
        <h1 className={`${ui.display} mt-2 break-words`}>{data.callsign}</h1>
        {data.rank && (
          <div className="mt-2">
            <span className={badgeClass("brand")}>
              {GLYPH.rank} {data.rank}
            </span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl font-bold tabular-nums text-[var(--c-brand-text)]">
                {s.value}
              </div>
              <div className={ui.metaFaint}>{s.label}</div>
            </div>
          ))}
        </div>

        {metaLine && <p className={`mt-5 ${ui.muted}`}>{metaLine}</p>}

        {data.achievements.length > 0 && (
          <div className="mt-6">
            <h2 className={ui.sectionTitle}>{st(lang, "card_achievements")}</h2>
            <div className="mt-3 flex justify-center">
              <AchievementsRow list={data.achievements} lang={lang} />
            </div>
          </div>
        )}
      </section>

      {/* CTA — лише сайт (site-first), без бота. Незалогінений → «Більше про нас» + «Долучитися»;
          залогінений → «На головну» + «Мій кабінет». */}
      <section className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={btn("outline")}>
          {loggedIn ? st(lang, "card_home") : st(lang, "card_about")}
        </Link>
        <Link href={loggedIn ? "/cabinet" : "/register"} className={btn("action")}>
          {loggedIn ? st(lang, "card_my_cabinet") : st(lang, "card_join")}
        </Link>
      </section>

      {/* Соцмережі команди */}
      <section>
        <h2 className={`text-center ${ui.sectionTitle}`}>{st(lang, "home_social_title")}</h2>
        <SocialLinks settings={settings} lang={lang} />
      </section>
    </div>
  );
}
