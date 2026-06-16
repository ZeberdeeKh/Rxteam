import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listRentalRequests } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";
import { ui } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminRental() {
  await requirePerm("rental");
  const lang = getServerLang();
  const reqs = await listRentalRequests();

  return (
    <div className={ui.pageStack}>
      <p className={ui.muted}>{st(lang, "adm_rental_note")}</p>

      {reqs.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_empty")}</p>
      ) : (
        <div className={`overflow-x-auto ${ui.tableWrap} bg-white`}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>{st(lang, "games_label_when")}</th>
                <th className={ui.th}>{st(lang, "adm_f_title")}</th>
                <th className={ui.th}>{st(lang, "ranking_col_player")}</th>
              </tr>
            </thead>
            <tbody className={ui.tbody}>
              {reqs.map((r, i) => (
                <tr key={i}>
                  <td className={`whitespace-nowrap ${ui.td}`}>
                    {r.start_at ? formatGameWhen(r.start_at, lang) : "—"}
                  </td>
                  <td className={`${ui.td} text-gray-900`}>{r.gameTitle ?? "ASG"}</td>
                  <td className={`${ui.td} font-medium text-gray-900`}>
                    {r.callsign ?? r.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
