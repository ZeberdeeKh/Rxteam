import { st, type Lang } from "@/lib/site-i18n";
import type { RankingRow } from "@/lib/site-data";
import { ui, GLYPH } from "@/components/ui";

// Таблиця рейтингу (топ гравців). Показується на лендінгу.
export default function RankingTable({ rows, lang }: { rows: RankingRow[]; lang: Lang }) {
  if (rows.length === 0) {
    return (
      <p className={ui.emptyState}>
        {st(lang, "ranking_empty")}
      </p>
    );
  }

  return (
    <div className={ui.tableWrapCut}>
      <div className="overflow-x-auto">
        <table className={ui.table}>
          <thead className={ui.thead}>
            <tr>
              <th className={`${ui.th} w-10`}>{st(lang, "ranking_col_pos")}</th>
              <th className={ui.th}>{st(lang, "ranking_col_player")}</th>
              <th className={ui.th}>{st(lang, "ranking_col_rank")}</th>
              <th className={`${ui.th} text-right`}>{st(lang, "ranking_col_earned")}</th>
              <th className={`${ui.th} text-right`}>{st(lang, "ranking_col_games")}</th>
            </tr>
          </thead>
          <tbody className={ui.tbody}>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className={`${ui.td} text-gray-400`}>{i + 1}</td>
                <td className={`${ui.td} font-medium text-gray-900`}>
                  {r.callsign ?? st(lang, "ranking_anon")}
                </td>
                <td className={ui.td}>{r.has_patch ? r.rank ?? "Recruit" : "—"}</td>
                <td className={`${ui.td} text-right tabular-nums text-gray-900`}>
                  {r.points_earned} {GLYPH.points}
                </td>
                <td className={`${ui.td} text-right tabular-nums`}>{r.games_played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
