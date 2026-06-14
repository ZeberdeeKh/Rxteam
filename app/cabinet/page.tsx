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
      {okKey && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, okKey)}</p>
      )}
      {errKey && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{st(lang, errKey)}</p>
      )}
    </>
  );

  // ── unlinked: прив'язка TG або standalone-профіль ──
  if (ctx.state === "unlinked") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
            {st(lang, "cabinet_title")}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">{ctx.email}</p>
        </div>
        {banners}
        <LinkTelegramForm lang={lang} />
        <div className="flex items-center gap-3 text-xs uppercase text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          {st(lang, "or_divider")}
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-base font-semibold text-neutral-900">{st(lang, "standalone_title")}</h2>
          <p className="mt-1 text-sm text-neutral-600">{st(lang, "standalone_intro")}</p>
          <form action={createStandalone} className="mt-3">
            <button
              type="submit"
              className="rounded-md border border-brand px-4 py-1.5 text-sm font-medium text-brand transition hover:bg-brand hover:text-white"
            >
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
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
          {st(lang, "cabinet_title")}
        </h1>
        {banners}
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-base font-semibold text-neutral-900">{st(lang, "callsign_title")}</h2>
          <p className="mt-1 text-sm text-neutral-600">{st(lang, "callsign_intro")}</p>
          <form action={saveCallsign} className="mt-3 flex gap-2">
            <input
              name="callsign"
              required
              minLength={2}
              maxLength={32}
              placeholder={st(lang, "callsign_ph")}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
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
    getPointLog(player.id),
    getPlayerAchievements(player.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
          {st(lang, "cabinet_title")}
        </h1>
        {ctx.email && <p className="mt-2 text-sm text-neutral-500">{ctx.email}</p>}
      </div>
      {banners}

      {/* Профіль */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {st(lang, "prof_section")}
        </h2>
        <dl className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-500">{st(lang, "prof_callsign")}</dt>
            <dd className="font-medium text-neutral-900">{player.callsign}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">{st(lang, "prof_rank")}</dt>
            <dd className="font-medium text-neutral-900">
              {player.has_patch ? player.rank ?? "Recruit" : st(lang, "prof_no_rank")}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">{st(lang, "prof_reliability")}</dt>
            <dd className="font-medium text-neutral-900">{rel.pct === null ? "—" : `${rel.pct}%`}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">{st(lang, "prof_earned")}</dt>
            <dd className="font-medium text-neutral-900">{player.points_earned ?? 0} ⭐</dd>
          </div>
          <div>
            <dt className="text-neutral-500">{st(lang, "prof_balance")}</dt>
            <dd className="font-medium text-neutral-900">{player.points_balance ?? 0} 💰</dd>
          </div>
          <div>
            <dt className="text-neutral-500">{st(lang, "prof_games")}</dt>
            <dd className="font-medium text-neutral-900">{player.games_played ?? 0}</dd>
          </div>
        </dl>
      </section>

      {/* Ачівки */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">{st(lang, "ach_title")}</h2>
        {achs.length === 0 ? (
          <p className="text-sm text-neutral-500">{st(lang, "ach_empty")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {achs.map((a) => (
              <li
                key={a.code}
                className="rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-medium text-brand-dark"
                title={formatGameWhen(a.created_at, lang)}
              >
                🎖️ {achTitle(a, lang)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Мої ігри */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">{st(lang, "mygames_title")}</h2>
        {games.length === 0 ? (
          <p className="text-sm text-neutral-500">{st(lang, "mygames_empty")}</p>
        ) : (
          <div className="space-y-4">
            {games.map((g) => {
              const label = regStatusLabel(g, lang);
              return (
                <GameCard key={g.id} game={g} lang={lang}>
                  <div className="flex flex-wrap items-center gap-3">
                    {label && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          g.regStatus === "registered"
                            ? "bg-green-100 text-green-700"
                            : g.regStatus === "no_show"
                              ? "bg-red-100 text-red-700"
                              : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {label}
                      </span>
                    )}
                    {g.checkedIn && (
                      <span className="text-xs font-medium text-green-700">
                        {st(lang, "game_checked_in")}
                      </span>
                    )}

                    {g.checkinOpen && <CheckinButton gameId={g.id} lang={lang} />}

                    {g.canUnregister && (
                      <form action={unregisterFromGame}>
                        <input type="hidden" name="gameId" value={g.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition hover:border-red-400 hover:text-red-600"
                        >
                          {st(lang, "btn_unregister")}
                        </button>
                      </form>
                    )}

                    {g.regStatus === "registered" && !g.canUnregister && !g.checkinOpen && (
                      <span className="text-xs text-neutral-400">
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
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">{st(lang, "hist_title")}</h2>
        {log.length === 0 ? (
          <p className="text-sm text-neutral-500">{st(lang, "hist_empty")}</p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white text-sm">
            {log.map((row, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2">
                <div>
                  <span className="text-neutral-700">{st(lang, `reason_${row.reason}`)}</span>
                  <span className="ml-2 text-xs text-neutral-400">
                    {formatGameWhen(row.created_at, lang)}
                  </span>
                </div>
                <span
                  className={`shrink-0 tabular-nums font-medium ${
                    row.delta >= 0 ? "text-green-600" : "text-red-600"
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
