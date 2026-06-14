import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listPlayers } from "@/lib/admin-data";
import { adjustPoints, setPlayerCallsign, togglePatch } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminPlayers({
  searchParams,
}: {
  searchParams: { adjusted?: string; callsign?: string; patch?: string; err?: string };
}) {
  await requirePerm("players");
  const lang = getServerLang();
  const players = await listPlayers();
  const smallInput =
    "rounded-md border border-neutral-300 px-2 py-1 text-xs focus:border-brand focus:outline-none";

  const ok = searchParams.adjusted || searchParams.callsign || searchParams.patch;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "adm_players_title")}</h1>
      {ok && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, "adm_done")}</p>}
      {searchParams.err && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{st(lang, "err_callsign_taken")}</p>
      )}

      <div className="space-y-3">
        {players.map((p) => (
          <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-semibold text-neutral-900">{p.callsign ?? "—"}</span>
                <span className="ml-2 text-sm text-neutral-500">{p.name ?? ""}</span>
                {p.tg_username && <span className="ml-2 text-xs text-neutral-400">@{p.tg_username}</span>}
                {p.is_master && (
                  <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-dark">
                    {st(lang, "adm_master")}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500">
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
                <button type="submit" className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-dark">
                  {st(lang, "adm_btn_adjust")}
                </button>
              </form>

              <form action={setPlayerCallsign} className="flex items-center gap-1">
                <input type="hidden" name="playerId" value={p.id} />
                <input name="callsign" defaultValue={p.callsign ?? ""} className={`${smallInput} w-28`} />
                <button type="submit" className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs hover:border-brand hover:text-brand">
                  {st(lang, "adm_btn_callsign")}
                </button>
              </form>

              <form action={togglePatch}>
                <input type="hidden" name="playerId" value={p.id} />
                <button type="submit" className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs hover:border-brand hover:text-brand">
                  {st(lang, "adm_btn_patch")}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
