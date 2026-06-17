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
        {/* table-fixed: # вузька (4%); чотири колонки даних рівні (по 18%), усі ліворуч —
            щоб відступи між ними були однакові; ачівки — остання й трохи ширша (24%). */}
        <table className={`${ui.table} table-fixed`}>
          <thead className={ui.thead}>
            <tr>
              <th className={`${ui.th} w-[4%]`}>{st(lang, "ranking_col_pos")}</th>
              <th className={`${ui.th} w-[18%]`}>{st(lang, "ranking_col_player")}</th>
              <th className={`${ui.th} w-[18%]`}>{st(lang, "ranking_col_rank")}</th>
              <th className={`${ui.th} w-[18%]`}>{st(lang, "ranking_col_earned")}</th>
              <th className={`${ui.th} w-[18%]`}>{st(lang, "ranking_col_games")}</th>
              <th className={`${ui.th} w-[24%]`}>{st(lang, "ranking_col_ach")}</th>
            </tr>
          </thead>
          <tbody className={ui.tbody}>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className={`${ui.td} text-gray-400`}>{i + 1}</td>
                <td className={`${ui.td} truncate font-medium text-gray-900`}>
                  {r.callsign ?? st(lang, "ranking_anon")}
                </td>
                <td className={`${ui.td} truncate`}>{r.has_patch ? r.rank ?? "Recruit" : "—"}</td>
                <td className={`${ui.td} tabular-nums text-gray-900`}>
                  {r.points_earned} {GLYPH.points}
                </td>
                <td className={`${ui.td} tabular-nums`}>{r.games_played}</td>
                {/* Остання колонка — здобуті ачівки (кількість різна → іконки переносяться). */}
                <td className={`${ui.td} !h-auto py-1.5`}>
                  {r.achievements.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1">
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
                            className="h-5 w-5 object-contain"
                          />
                        ) : (
                          <span key={a.code} title={title} className="text-sm leading-none">
                            {GLYPH.rank}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
