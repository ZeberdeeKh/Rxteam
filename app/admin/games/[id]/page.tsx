import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm, getAdmin, hasPerm } from "@/lib/admin";
import { getGameDetail } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";
import { cancelGame, manualCheckin, markNoShow } from "@/app/admin/actions";

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
    <div className="space-y-6">
      <Link href="/admin/games" className="text-sm text-brand hover:underline">
        {st(lang, "adm_back")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
            {game.title ?? "ASG"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {formatGameWhen(game.gather_at ?? game.start_at, lang)} · {game.location_name ?? "—"} ·{" "}
            <span className="font-medium">{game.status}</span>
          </p>
        </div>
        {game.status === "announced" && (
          <form action={cancelGame}>
            <input type="hidden" name="gameId" value={game.id} />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              {st(lang, "adm_btn_cancel_game")}
            </button>
          </form>
        )}
      </div>

      {(searchParams.checked || searchParams.noshow) && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, "adm_done")}</p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">{st(lang, "adm_game_regs")}</h2>
        {game.regs.length === 0 ? (
          <p className="text-sm text-neutral-500">{st(lang, "adm_no_regs")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <tbody>
                {game.regs.map((r) => (
                  <tr key={r.playerId} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2">
                      <span className="font-medium text-neutral-900">
                        {r.callsign ?? r.name ?? `#${r.playerId}`}
                      </span>
                      {r.needs_rental && (
                        <span className="ml-2 text-xs text-amber-600">{st(lang, "adm_rental_flag")}</span>
                      )}
                      {r.transport && (
                        <span className="ml-2 text-xs text-neutral-400">
                          {r.transport === "own"
                            ? st(lang, "reg_transport_own")
                            : st(lang, "reg_transport_need")}
                          {r.from_place ? ` · ${r.from_place}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          r.status === "registered"
                            ? "bg-green-100 text-green-700"
                            : r.status === "no_show"
                              ? "bg-red-100 text-red-700"
                              : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.checkedIn ? (
                        <span className="text-xs font-medium text-green-700">
                          {st(lang, "adm_checked")}
                        </span>
                      ) : (
                        canCheckin && (
                          <div className="flex justify-end gap-2">
                            <form action={manualCheckin}>
                              <input type="hidden" name="gameId" value={game.id} />
                              <input type="hidden" name="playerId" value={r.playerId} />
                              <button
                                type="submit"
                                className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-dark"
                              >
                                {st(lang, "adm_btn_checkin")}
                              </button>
                            </form>
                            {r.status !== "no_show" && (
                              <form action={markNoShow}>
                                <input type="hidden" name="gameId" value={game.id} />
                                <input type="hidden" name="playerId" value={r.playerId} />
                                <button
                                  type="submit"
                                  className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:border-red-400 hover:text-red-600"
                                >
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
