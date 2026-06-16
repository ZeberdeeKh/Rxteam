import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st, statusText } from "@/lib/site-i18n";
import { requirePerm, getAdmin, hasPerm } from "@/lib/admin";
import { getGameDetail } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";
import { cancelGame, manualCheckin, markNoShow } from "@/app/admin/actions";
import { ui, btn, badgeClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminGameDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { checked?: string; noshow?: string };
}) {
  await requirePerm("games");
  const admin = (await getAdmin())!;
  const canCheckin = hasPerm(admin, "checkin");
  const lang = getServerLang();

  const game = await getGameDetail(Number(params.id));
  if (!game) notFound();

  return (
    <div className={ui.pageStack}>
      <Link href="/admin/games" className={`text-sm ${ui.link}`}>
        {st(lang, "adm_back")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={ui.pageTitle}>
            {game.title ?? "ASG"}
          </h1>
          <p className={`mt-1 ${ui.muted}`}>
            {formatGameWhen(game.gather_at ?? game.start_at, lang)} · {game.location_name ?? "—"} ·{" "}
            <span className="font-medium">{statusText(lang, "gamest", game.status)}</span>
          </p>
        </div>
        {game.status === "announced" && (
          <form action={cancelGame}>
            <input type="hidden" name="gameId" value={game.id} />
            <button type="submit" className={btn("delete")}>
              {st(lang, "adm_btn_cancel_game")}
            </button>
          </form>
        )}
      </div>

      {(searchParams.checked || searchParams.noshow) && (
        <p className={ui.alertOk}>{st(lang, "adm_done")}</p>
      )}

      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>{st(lang, "adm_game_regs")}</h2>
        {game.regs.length === 0 ? (
          <p className={ui.muted}>{st(lang, "adm_no_regs")}</p>
        ) : (
          <div className={`overflow-x-auto ${ui.tableWrap} bg-white`}>
            <table className={ui.table}>
              <tbody className={ui.tbody}>
                {game.regs.map((r) => (
                  <tr key={r.playerId}>
                    <td className={ui.td}>
                      <span className="font-medium text-gray-900">
                        {r.callsign ?? r.name ?? `#${r.playerId}`}
                      </span>
                      {r.needs_rental && (
                        <span className={`ml-2 text-xs ${ui.warnText}`}>{st(lang, "adm_rental_flag")}</span>
                      )}
                      {r.transport && (
                        <span className="ml-2 text-xs text-gray-400">
                          {r.transport === "own"
                            ? st(lang, "reg_transport_own")
                            : st(lang, "reg_transport_need")}
                          {r.from_place ? ` · ${r.from_place}` : ""}
                        </span>
                      )}
                    </td>
                    <td className={ui.td}>
                      <span
                        className={badgeClass(
                          r.status === "registered"
                            ? "green"
                            : r.status === "no_show"
                              ? "red"
                              : "gray",
                        )}
                      >
                        {statusText(lang, "regst", r.status)}
                      </span>
                    </td>
                    <td className={`${ui.td} text-right`}>
                      {r.checkedIn ? (
                        <span className={`text-xs font-medium ${ui.posText}`}>
                          {st(lang, "adm_checked")}
                        </span>
                      ) : (
                        canCheckin && (
                          <div className="flex justify-end gap-2">
                            <form action={manualCheckin}>
                              <input type="hidden" name="gameId" value={game.id} />
                              <input type="hidden" name="playerId" value={r.playerId} />
                              <button type="submit" className={btn("action")}>
                                {st(lang, "adm_btn_checkin")}
                              </button>
                            </form>
                            {r.status !== "no_show" && (
                              <form action={markNoShow}>
                                <input type="hidden" name="gameId" value={game.id} />
                                <input type="hidden" name="playerId" value={r.playerId} />
                                <button type="submit" className={btn("delete")}>
                                  {st(lang, "adm_btn_noshow")}
                                </button>
                              </form>
                            )}
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
