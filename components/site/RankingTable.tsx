import { st, type Lang } from "@/lib/site-i18n";
import type { RankingRow, RankAch } from "@/lib/site-data";
import { ui, GLYPH } from "@/components/ui";
import AchievementsRow from "./AchievementsRow";

type RankingRowWithAch = RankingRow & { achievements: RankAch[] };

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
    <>
      {/* Десктоп (md+): повна таблиця. На вузькому екрані вона нечитабельна (6 колонок у 343px),
          тому ховаємо її < md і показуємо стек карток нижче. */}
      <div className={`hidden md:block ${ui.tableWrapCut}`}>
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
                    <AchievementsRow list={r.achievements} lang={lang} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Мобільний (< md): стек тактичних карток. Позиція + позивний + мета-рядок (ранг · бали · ігри),
          ачівки — окремим повноширинним рядком, де 20px іконки мають усю ширину. */}
      <ol className="space-y-2 md:hidden">
        {rows.map((r, i) => (
          <li key={r.id} className="rx-chamfer [--cut:8px] p-4">
            <div className="flex items-start gap-3">
              <span
                className={`font-display text-xl font-bold tabular-nums leading-none ${
                  i < 3 ? "text-[var(--c-brand-text)]" : "text-gray-400"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold uppercase tracking-wide text-gray-900">
                  {r.callsign ?? st(lang, "ranking_anon")}
                </p>
                <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">{st(lang, "ranking_col_rank")}:</span>{" "}
                    {r.has_patch ? r.rank ?? "Recruit" : "—"}
                  </div>
                  <div className="tabular-nums">
                    <span className="text-gray-400">{st(lang, "ranking_col_earned")}:</span>{" "}
                    {r.points_earned} {GLYPH.points}
                  </div>
                  <div className="tabular-nums">
                    <span className="text-gray-400">{st(lang, "ranking_col_games")}:</span>{" "}
                    {r.games_played}
                  </div>
                </dl>
                {r.achievements.length > 0 && (
                  <div className="mt-2">
                    <AchievementsRow list={r.achievements} lang={lang} />
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
