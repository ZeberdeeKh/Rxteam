import { st, type Lang } from "@/lib/site-i18n";
import type { RankingRow, RankAch } from "@/lib/site-data";
import { ui, GLYPH } from "@/components/ui";

type RankingRowWithAch = RankingRow & { achievements: RankAch[] };

// Локалізована назва ачівки (для підказки title=); fallback між мовами, далі — код.
function achTitle(a: RankAch, lang: Lang): string {
  return (
    (lang === "pl" ? a.title_pl : lang === "uk" ? a.title_uk : a.title_en) ??
    a.title_pl ??
    a.title_en ??
    a.title_uk ??
    a.code
  );
}

// Таблиця рейтингу (топ гравців). Показується на лендінгу.
export default function RankingTable({ rows, lang }: { rows: RankingRowWithAch[]; lang: Lang }) {
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
                  <div>{r.callsign ?? st(lang, "ranking_anon")}</div>
                  {r.achievements.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {r.achievements.map((a) => {
                        const title = achTitle(a, lang);
                        return a.thumbnail_svg ? (
                          // base64 data URL → інертний <img> (XSS-safe), див. Етап 20.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={a.code}
                            src={a.thumbnail_svg}
                            alt={title}
                            title={title}
                            className="h-4 w-4 object-contain"
                          />
                        ) : (
                          <span key={a.code} title={title} className="text-xs leading-none">
                            {GLYPH.rank}
                          </span>
                        );
                      })}
                    </div>
                  )}
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
