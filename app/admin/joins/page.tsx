import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listJoinChallenges } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function AdminJoins() {
  await requirePerm("joins");
  const lang = getServerLang();
  const rows = await listJoinChallenges();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "adm_joins_title")}</h1>
      <p className="text-sm text-gray-500">{st(lang, "adm_joins_note")}</p>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{st(lang, "adm_empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-3 py-2 font-medium">user_id</th>
                <th className="px-3 py-2 font-medium">lang</th>
                <th className="px-3 py-2 font-medium">{st(lang, "adm_col_status")}</th>
                <th className="px-3 py-2 font-medium">{st(lang, "games_label_when")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 tabular-nums text-gray-700">{r.user_id}</td>
                  <td className="px-3 py-2 text-gray-500">{r.lang}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.status === "passed"
                          ? "bg-green-100 text-green-700"
                          : r.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">
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
