import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listPlayers } from "@/lib/admin-data";
import { adjustPoints, setPlayerCallsign, togglePatch, makeAdmin } from "@/app/admin/actions";
import { ui, buttonClass, badgeClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminPlayers({
  searchParams,
}: {
  searchParams: { adjusted?: string; callsign?: string; patch?: string; admin?: string; err?: string };
}) {
  const me = await requirePerm("players");
  const lang = getServerLang();
  const players = await listPlayers();
  const smallInput = ui.inputSm;

  const ok = searchParams.adjusted || searchParams.callsign || searchParams.patch || searchParams.admin;

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_players_title")}</h1>
      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err && (
        <p className={ui.alertErr}>{st(lang, "err_callsign_taken")}</p>
      )}

      <div className={ui.listStack}>
        {players.map((p) => (
          <div key={p.id} className={ui.card}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className={ui.cardTitle}>{p.callsign ?? "—"}</span>
                <span className="ml-2 text-sm text-gray-500">{p.name ?? ""}</span>
                {p.tg_username && <span className="ml-2 text-xs text-gray-400">@{p.tg_username}</span>}
                {p.is_master ? (
                  <span className={`ml-2 ${badgeClass("brand")}`}>
                    {st(lang, "adm_master")}
                  </span>
                ) : (
                  p.is_admin && (
                    <span className={`ml-2 ${badgeClass("green")}`}>
                      {st(lang, "adm_role_admin")}
                    </span>
                  )
                )}
              </div>
              <div className={ui.meta}>
                {st(lang, "adm_earned")}: <b>{p.points_earned}</b> · {st(lang, "adm_balance")}:{" "}
                <b>{p.points_balance}</b> · {st(lang, "adm_games_n")}: <b>{p.games_played}</b> ·{" "}
                {p.has_patch ? `🎖️ ${p.rank ?? "Recruit"}` : "—"}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <form action={adjustPoints} className="flex items-center gap-1">
                <input type="hidden" name="playerId" value={p.id} />
                <input
                  name="delta"
                  type="number"
                  placeholder={st(lang, "adm_delta_ph")}
                  className={`${smallInput} w-24`}
                  required
                />
                <button type="submit" className={buttonClass("primary", "sm")}>
                  {st(lang, "adm_btn_adjust")}
                </button>
              </form>

              <form action={setPlayerCallsign} className="flex items-center gap-1">
                <input type="hidden" name="playerId" value={p.id} />
                <input name="callsign" defaultValue={p.callsign ?? ""} className={`${smallInput} w-28`} />
                <button type="submit" className={buttonClass("secondary", "sm")}>
                  {st(lang, "adm_btn_callsign")}
                </button>
              </form>

              <form action={togglePatch}>
                <input type="hidden" name="playerId" value={p.id} />
                <button type="submit" className={buttonClass("secondary", "sm")}>
                  {st(lang, "adm_btn_patch")}
                </button>
              </form>

              {/* Призначення адміном — лише майстер, і лише для звичайних гравців. */}
              {me.is_master && !p.is_master && !p.is_admin && (
                <form action={makeAdmin}>
                  <input type="hidden" name="playerId" value={p.id} />
                  <button type="submit" className={buttonClass("primary", "sm")}>
                    {st(lang, "adm_make_admin")}
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
