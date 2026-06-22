import { redirect } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { getSessionContext } from "@/lib/session-player";
import { getCabinetGames, type CabinetGame } from "@/lib/site-data";
import CheckinButton from "@/components/cabinet/CheckinButton";
import RegisterForm from "@/components/cabinet/RegisterForm";
import CarpoolEditToggle from "@/components/site/CarpoolEditToggle";
import GameCard from "@/components/site/GameCard";
import { unregisterFromGame } from "@/app/cabinet/actions";
import { ui, btn, badgeClass } from "@/components/ui";

export const dynamic = "force-dynamic";

const RETURN_TO = "/my-games";

type Flags = { [key: string]: string | string[] | undefined };

function successKey(f: Flags): string | null {
  if (f.reg) return "cab_reg_ok";
  if (f.unreg) return "cab_unreg_ok";
  if (f.checkin) return "cab_checkin_ok";
  return null;
}

function regStatusLabel(g: CabinetGame, lang: Lang): string | null {
  if (g.regStatus === "registered") return st(lang, "regst_registered");
  if (g.regStatus === "cancelled") return st(lang, "regst_cancelled");
  if (g.regStatus === "no_show") return st(lang, "regst_no_show");
  return null;
}

export default async function MyGamesPage({ searchParams }: { searchParams: Flags }) {
  const ctx = await getSessionContext();
  if (ctx.state === "anon") redirect("/login");
  // Профіль/позивний оформлюються в Кабінеті — без них список ігор недоступний.
  if (ctx.state === "unlinked" || !ctx.player.callsign) redirect("/cabinet");

  const lang = getServerLang();
  const okKey = successKey(searchParams);
  const errVal = typeof searchParams.err === "string" ? searchParams.err : null;
  const errKey = errVal ? `err_${errVal}` : null;

  const games = await getCabinetGames(ctx.player.id);

  return (
    <div className={`${ui.widthWide} ${ui.pageStack}`}>
      {okKey && <p className={ui.alertOk}>{st(lang, okKey)}</p>}
      {errKey && <p className={ui.alertErr}>{st(lang, errKey)}</p>}

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

                    {g.checkinOpen && <CheckinButton gameId={g.id} lang={lang} returnTo={RETURN_TO} />}

                    {g.canUnregister && (
                      <form action={unregisterFromGame}>
                        <input type="hidden" name="gameId" value={g.id} />
                        <input type="hidden" name="returnTo" value={RETURN_TO} />
                        <button type="submit" className={btn("delete", "sm")}>
                          {st(lang, "btn_unregister")}
                        </button>
                      </form>
                    )}

                    {g.regStatus === "registered" && !g.canUnregister && !g.checkinOpen && (
                      <span className={ui.metaFaint}>
                        {st(lang, "cancel_locked_info")}
                      </span>
                    )}
                    {g.regStatus === "registered" && (
                      <CarpoolEditToggle
                        gameId={g.id}
                        lang={lang}
                        returnTo={RETURN_TO}
                        initial={{
                          transport: g.myTransport,
                          freeSeats: g.myFreeSeats,
                          ridePrice: g.myRidePrice,
                          rideNote: g.myRideNote,
                          fromLat: g.myFromLat,
                          fromLng: g.myFromLng,
                          pickups: g.myPickups,
                          seatsClosed: g.mySeatsClosed,
                        }}
                      />
                    )}
                  </div>

                  {g.canRegister && (
                    <div className="mt-3">
                      <RegisterForm gameId={g.id} lang={lang} returnTo={RETURN_TO} />
                    </div>
                  )}
                </GameCard>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
