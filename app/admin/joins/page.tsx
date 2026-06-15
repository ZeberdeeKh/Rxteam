import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listJoinChallenges } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";
import { ui, badgeClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminJoins() {
  await requirePerm("joins");
  const lang = getServerLang();
  const rows = await listJoinChallenges();

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_joins_title")}</h1>
      <p className={ui.muted}>{st(lang, "adm_joins_note")}</p>

      {rows.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_empty")}</p>
      ) : (
        <div className={`overflow-x-auto ${ui.tableWrap} bg-white`}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>user_id</th>
                <th className={ui.th}>lang</th>
                <th className={ui.th}>{st(lang, "adm_col_status")}</th>
                <th className={ui.th}>{st(lang, "games_label_when")}</th>
              </tr>
            </thead>
            <tbody className={ui.tbody}>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={`${ui.td} tabular-nums`}>{r.user_id}</td>
                  <td className={`${ui.td} text-gray-500`}>{r.lang}</td>
                  <td className={ui.td}>
                    <span
                      className={badgeClass(
                        r.status === "passed"
                          ? "green"
                          : r.status === "pending"
                            ? "amber"
                            : "gray",
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap ${ui.td} text-gray-500`}>
                    {formatGameWhen(r.created_at, lang)}
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
