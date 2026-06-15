import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getRanking } from "@/lib/site-data";
import { ui } from "@/components/ui";

export const dynamic = "force-dynamic";

// /ranking — топ-10 за «зароблено всього». Публічно (рішення організатора 2026-06-15).
export default async function RankingPage() {
  const lang = getServerLang();
  const rows = await getRanking(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.pageTitle}>
          {st(lang, "ranking_title")}
        </h1>
        <p className={`mt-1 ${ui.muted}`}>{st(lang, "ranking_intro")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
          {st(lang, "ranking_empty")}
        </p>
      ) : (
        <>
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={`${ui.th} w-10`}>{st(lang, "ranking_col_pos")}</th>
                  <th className={ui.th}>{st(lang, "ranking_col_player")}</th>
                  <th className={ui.th}>{st(lang, "ranking_col_rank")}</th>
                  <th className={`${ui.th} text-right`}>
                    {st(lang, "ranking_col_earned")}
                  </th>
                  <th className={`${ui.th} text-right`}>
                    {st(lang, "ranking_col_games")}
                  </th>
                </tr>
              </thead>
              <tbody className={ui.tbody}>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className={`${ui.td} text-gray-400`}>{i + 1}</td>
                    <td className={`${ui.td} font-medium text-gray-900`}>
                      {r.callsign ?? st(lang, "ranking_anon")}
                    </td>
                    <td className={ui.td}>
                      {r.has_patch ? r.rank ?? "Recruit" : "—"}
                    </td>
                    <td className={`${ui.td} text-right tabular-nums text-gray-900`}>
                      {r.points_earned} ⭐
                    </td>
                    <td className={`${ui.td} text-right tabular-nums`}>
                      {r.games_played}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={ui.meta}>{st(lang, "ranking_note_top")}</p>
        </>
      )}
    </div>
  );
}
