import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listGamesAdmin, listLocations } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";
import { createGame } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminGames({
  searchParams,
}: {
  searchParams: { created?: string; cancelled?: string; err?: string };
}) {
  await requirePerm("games");
  const lang = getServerLang();
  const [games, locations] = await Promise.all([listGamesAdmin(), listLocations()]);
  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "adm_games_title")}</h1>

      {searchParams.created && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, "adm_done")}</p>
      )}
      {searchParams.cancelled && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, "adm_done")}</p>
      )}
      {searchParams.err && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{st(lang, "adm_err_fields")}</p>
      )}

      {/* Нова гра */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">{st(lang, "adm_game_create")}</h2>
        {locations.length === 0 ? (
          <p className="text-sm text-gray-500">{st(lang, "adm_no_locations")}</p>
        ) : (
          <form action={createGame} className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">{st(lang, "adm_f_location")}</span>
              <select name="locationId" className={inputCls} required>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">{st(lang, "adm_f_title")}</span>
              <input name="title" className={inputCls} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">{st(lang, "adm_f_date")}</span>
              <input name="date" type="date" required className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">{st(lang, "adm_f_gather")}</span>
                <input name="gather" type="time" required className={inputCls} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">{st(lang, "adm_f_start")}</span>
                <input name="start" type="time" required className={inputCls} />
              </label>
            </div>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">{st(lang, "adm_f_capacity")}</span>
              <input name="capacity" type="number" min={0} defaultValue={0} className={inputCls} />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-gray-600">{st(lang, "adm_f_scenario_pl")}</span>
              <textarea name="scenario_pl" rows={2} className={inputCls} />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-gray-600">{st(lang, "adm_f_scenario_uk")}</span>
              <textarea name="scenario_uk" rows={2} className={inputCls} />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-neutral-50 transition hover:bg-brand-dark"
              >
                {st(lang, "adm_btn_create")}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Список ігор */}
      <section>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-3 py-2 font-medium">{st(lang, "games_label_when")}</th>
                <th className="px-3 py-2 font-medium">{st(lang, "adm_f_title")}</th>
                <th className="px-3 py-2 font-medium">{st(lang, "adm_col_status")}</th>
                <th className="px-3 py-2 text-right font-medium">{st(lang, "adm_col_reg")}</th>
                <th className="px-3 py-2 text-right font-medium">{st(lang, "adm_col_checkins")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id} className="border-b border-gray-100 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {formatGameWhen(g.gather_at ?? g.start_at, lang)}
                  </td>
                  <td className="px-3 py-2 text-gray-900">
                    {g.title ?? "ASG"}
                    <span className="ml-1 text-xs text-gray-400">{g.location_name ?? ""}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        g.status === "announced"
                          ? "bg-green-100 text-green-700"
                          : g.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.regCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.checkinCount}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/games/${g.id}`} className="text-brand hover:underline">
                      {st(lang, "adm_open")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
