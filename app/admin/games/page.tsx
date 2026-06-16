import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listGamesAdmin, listLocations } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";
import { createGame } from "@/app/admin/actions";
import { ui, btn, badgeClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminGames({
  searchParams,
}: {
  searchParams: { created?: string; cancelled?: string; err?: string };
}) {
  await requirePerm("games");
  const lang = getServerLang();
  const [games, locations] = await Promise.all([listGamesAdmin(), listLocations()]);
  const inputCls = ui.input;

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_games_title")}</h1>

      {searchParams.created && (
        <p className={ui.alertOk}>{st(lang, "adm_done")}</p>
      )}
      {searchParams.cancelled && (
        <p className={ui.alertOk}>{st(lang, "adm_done")}</p>
      )}
      {searchParams.err && (
        <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>
      )}

      {/* Нова гра */}
      <section className={ui.card}>
        <h2 className={`mb-3 ${ui.cardTitle}`}>{st(lang, "adm_game_create")}</h2>
        {locations.length === 0 ? (
          <p className={ui.muted}>{st(lang, "adm_no_locations")}</p>
        ) : (
          <form action={createGame} className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_f_location")}</span>
              <select name="locationId" className={inputCls} required>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_f_title")}</span>
              <input name="title" className={inputCls} />
            </label>
            <label className="text-sm">
              <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_f_date")}</span>
              <input name="date" type="date" required className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_f_gather")}</span>
                <input name="gather" type="time" required className={inputCls} />
              </label>
              <label className="text-sm">
                <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_f_start")}</span>
                <input name="start" type="time" required className={inputCls} />
              </label>
            </div>
            <label className="text-sm">
              <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_f_capacity")}</span>
              <input name="capacity" type="number" min={0} defaultValue={0} className={inputCls} />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_f_scenario_pl")}</span>
              <textarea name="scenario_pl" rows={2} className={inputCls} />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_f_scenario_uk")}</span>
              <textarea name="scenario_uk" rows={2} className={inputCls} />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className={btn("action", "md")}>
                {st(lang, "adm_btn_create")}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Список ігор */}
      <section>
        <div className={`overflow-x-auto ${ui.tableWrap} bg-white`}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>{st(lang, "games_label_when")}</th>
                <th className={ui.th}>{st(lang, "adm_f_title")}</th>
                <th className={ui.th}>{st(lang, "adm_col_status")}</th>
                <th className={`${ui.th} text-right`}>{st(lang, "adm_col_reg")}</th>
                <th className={`${ui.th} text-right`}>{st(lang, "adm_col_checkins")}</th>
                <th className={ui.th} />
              </tr>
            </thead>
            <tbody className={ui.tbody}>
              {games.map((g) => (
                <tr key={g.id}>
                  <td className={`whitespace-nowrap ${ui.td}`}>
                    {formatGameWhen(g.gather_at ?? g.start_at, lang)}
                  </td>
                  <td className={ui.td}>
                    {g.title ?? "ASG"}
                    <span className="ml-1 text-xs text-gray-400">{g.location_name ?? ""}</span>
                  </td>
                  <td className={ui.td}>
                    <span
                      className={badgeClass(
                        g.status === "announced"
                          ? "green"
                          : g.status === "cancelled"
                            ? "red"
                            : "gray",
                      )}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className={`${ui.td} text-right tabular-nums`}>{g.regCount}</td>
                  <td className={`${ui.td} text-right tabular-nums`}>{g.checkinCount}</td>
                  <td className={`${ui.td} text-right`}>
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
