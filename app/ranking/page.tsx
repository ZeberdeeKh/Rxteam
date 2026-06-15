import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getRanking } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// /ranking — топ-10 за «зароблено всього». Публічно (рішення організатора 2026-06-15).
export default async function RankingPage() {
  const lang = getServerLang();
  const rows = await getRanking(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
          {st(lang, "ranking_title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{st(lang, "ranking_intro")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
          {st(lang, "ranking_empty")}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="w-10 px-3 py-2 font-medium">{st(lang, "ranking_col_pos")}</th>
                  <th className="px-3 py-2 font-medium">{st(lang, "ranking_col_player")}</th>
                  <th className="px-3 py-2 font-medium">{st(lang, "ranking_col_rank")}</th>
                  <th className="px-3 py-2 text-right font-medium">
                    {st(lang, "ranking_col_earned")}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {st(lang, "ranking_col_games")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {r.callsign ?? st(lang, "ranking_anon")}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {r.has_patch ? r.rank ?? "Recruit" : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                      {r.points_earned} ⭐
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                      {r.games_played}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">{st(lang, "ranking_note_top")}</p>
        </>
      )}
    </div>
  );
}
