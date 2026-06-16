import { redirect } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { getSessionContext } from "@/lib/session-player";
import { getReliability } from "@/lib/economy";
import {
  getCabinetGames,
  getPointLog,
  getPlayerAchievements,
  type CabinetGame,
  type PlayerAch,
} from "@/lib/site-data";
import { formatGameWhen } from "@/lib/games";
import LinkTelegramForm from "@/components/cabinet/LinkTelegramForm";
import RegisterForm from "@/components/cabinet/RegisterForm";
import CheckinButton from "@/components/cabinet/CheckinButton";
import GameCard from "@/components/site/GameCard";
import { createStandalone, saveCallsign, unregisterFromGame } from "@/app/cabinet/actions";
import { ui, btn, badgeClass, OrDivider, GLYPH } from "@/components/ui";

export const dynamic = "force-dynamic";

type Flags = { [key: string]: string | string[] | undefined };

function successKey(f: Flags): string | null {
  if (f.confirmed) return "auth_confirmed";
  if (f.linked) return "link_ok";
  if (f.welcome) return "cab_welcome";
  if (f.callsign) return "cab_callsign_saved";
  if (f.reg) return "cab_reg_ok";
  if (f.unreg) return "cab_unreg_ok";
  if (f.checkin) return "cab_checkin_ok";
  return null;
}

function achTitle(a: PlayerAch, lang: Lang): string {
  return (lang === "pl" ? a.title_pl : lang === "uk" ? a.title_uk : a.title_en) ?? a.code;
}

function regStatusLabel(g: CabinetGame, lang: Lang): string | null {
  if (g.regStatus === "registered") return st(lang, "regst_registered");
  if (g.regStatus === "cancelled") return st(lang, "regst_cancelled");
  if (g.regStatus === "no_show") return st(lang, "regst_no_show");
  return null;
}

export default async function CabinetPage({ searchParams }: { searchParams: Flags }) {
  const ctx = await getSessionContext();
  if (ctx.state === "anon") redirect("/login");

  const lang = getServerLang();
  const okKey = successKey(searchParams);
  const errVal = typeof searchParams.err === "string" ? searchParams.err : null;
  const errKey = errVal ? `err_${errVal}` : null;

  const banners = (
    <>
      {okKey && <p className={ui.alertOk}>{st(lang, okKey)}</p>}
      {errKey && <p className={ui.alertErr}>{st(lang, errKey)}</p>}
    </>
  );

  // ── unlinked: прив'язка TG або standalone-профіль ──
  if (ctx.state === "unlinked") {
    return (
      <div className={`${ui.widthNarrow} ${ui.pageStack}`}>
        {ctx.email && <p className="text-sm text-gray-500">{ctx.email}</p>}
        {banners}
        <LinkTelegramForm lang={lang} />
        <OrDivider>{st(lang, "or_divider")}</OrDivider>
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>{st(lang, "standalone_title")}</h2>
          <p className="mt-1 text-sm text-gray-600">{st(lang, "standalone_intro")}</p>
          <form action={createStandalone} className="mt-3">
            <button type="submit" className={btn("action")}>
              {st(lang, "standalone_btn")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  // ── linked ──
  const player = ctx.player;

  // Немає позивного (standalone щойно створений / бот-профіль без позивного) → форма позивного.
  if (!player.callsign) {
    return (
      <div className={`${ui.widthNarrow} ${ui.pageStack}`}>
        {banners}
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>{st(lang, "callsign_title")}</h2>
          <p className="mt-1 text-sm text-gray-600">{st(lang, "callsign_intro")}</p>
          <form action={saveCallsign} className="mt-3 flex gap-2">
            <input
              name="callsign"
              required
              minLength={2}
              maxLength={32}
              placeholder={st(lang, "callsign_ph")}
              className={`${ui.input} flex-1`}
            />
            <button type="submit" className={btn("action")}>
              {st(lang, "callsign_btn")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  const [rel, games, log, achs] = await Promise.all([
    getReliability(player.id),
    getCabinetGames(player.id),
    getPointLog(player.id, lang),
    getPlayerAchievements(player.id),
  ]);

  return (
    <div className={`${ui.widthProse} ${ui.pageStack}`}>
      {ctx.email && <p className="text-sm text-gray-500">{ctx.email}</p>}
      {banners}

      {/* Профіль */}
      <section className={ui.card}>
        <h2 className={`mb-3 ${ui.legend}`}>
          {st(lang, "prof_section")}
        </h2>
        <dl className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className={ui.meta}>{st(lang, "prof_callsign")}</dt>
            <dd className={ui.bodyStrong}>{player.callsign}</dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_rank")}</dt>
            <dd className={ui.bodyStrong}>
              {player.has_patch ? player.rank ?? "Recruit" : st(lang, "prof_no_rank")}
            </dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_reliability")}</dt>
            <dd className={ui.bodyStrong}>{rel.pct === null ? "—" : `${rel.pct}%`}</dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_earned")}</dt>
            <dd className={ui.bodyStrong}>{player.points_earned ?? 0} {GLYPH.points}</dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_balance")}</dt>
            <dd className={ui.bodyStrong}>{player.points_balance ?? 0} {GLYPH.balance}</dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_games")}</dt>
            <dd className={ui.bodyStrong}>{player.games_played ?? 0}</dd>
          </div>
        </dl>
      </section>

      {/* Ачівки */}
      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>{st(lang, "ach_title")}</h2>
        {achs.length === 0 ? (
          <p className={ui.emptyState}>{st(lang, "ach_empty")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {achs.map((a) => (
              <li key={a.code} className={badgeClass("brand")} title={formatGameWhen(a.created_at, lang)}>
                {GLYPH.rank} {achTitle(a, lang)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Мої ігри */}
      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>{st(lang, "mygames_title")}</h2>
        {games.length === 0 ? (
          <p className={ui.emptyState}>{st(lang, "mygames_empty")}</p>
        ) : (
          <div className="space-y-4">
            {games.map((g) => {
              const label = regStatusLabel(g, lang);
              return (
                <GameCard key={g.id} game={g} lang={lang}>
                  <div className="flex flex-wrap items-center gap-3">
                    {label && (
                      <span
                        className={badgeClass(
                          g.regStatus === "registered"
                            ? "green"
                            : g.regStatus === "no_show"
                              ? "red"
                              : "gray",
                        )}
                      >
                        {label}
                      </span>
                    )}
                    {g.checkedIn && (
                      <span className={`text-xs font-medium ${ui.posText}`}>
                        {st(lang, "game_checked_in")}
                      </span>
                    )}

                    {g.checkinOpen && <CheckinButton gameId={g.id} lang={lang} />}

                    {g.canUnregister && (
                      <form action={unregisterFromGame}>
                        <input type="hidden" name="gameId" value={g.id} />
                        <button type="submit" className={btn("delete")}>
                          {st(lang, "btn_unregister")}
                        </button>
                      </form>
                    )}

                    {g.regStatus === "registered" && !g.canUnregister && !g.checkinOpen && (
                      <span className={ui.metaFaint}>
                        {st(lang, "cancel_locked_info")}
                      </span>
                    )}
                  </div>

                  {g.canRegister && (
                    <div className="mt-3">
                      <RegisterForm gameId={g.id} lang={lang} />
                    </div>
                  )}
                </GameCard>
              );
            })}
          </div>
        )}
      </section>

      {/* Історія балів */}
      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>{st(lang, "hist_title")}</h2>
        {log.length === 0 ? (
          <p className={ui.emptyState}>{st(lang, "hist_empty")}</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white text-sm">
            {log.map((row, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2">
                <div>
                  <span className="text-gray-700">{st(lang, `reason_${row.reason}`)}</span>
                  <span className={`ml-2 ${ui.metaFaint}`}>
                    {formatGameWhen(row.created_at, lang)}
                  </span>
                  {row.itemTitle && (
                    <p className="mt-0.5 text-xs text-gray-500">{row.itemTitle}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 tabular-nums font-medium ${
                    row.delta >= 0 ? ui.posDelta : ui.negDelta
                  }`}
                >
                  {row.delta >= 0 ? "+" : ""}
                  {row.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
