import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listRentalRequests } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function AdminRental() {
  await requirePerm("rental");
  const lang = getServerLang();
  const reqs = await listRentalRequests();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "adm_rental_title")}</h1>
      <p className="text-sm text-gray-500">{st(lang, "adm_rental_note")}</p>

      {reqs.length === 0 ? (
        <p className="text-sm text-gray-500">{st(lang, "adm_empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-3 py-2 font-medium">{st(lang, "games_label_when")}</th>
                <th className="px-3 py-2 font-medium">{st(lang, "adm_f_title")}</th>
                <th className="px-3 py-2 font-medium">{st(lang, "ranking_col_player")}</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {r.start_at ? formatGameWhen(r.start_at, lang) : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-900">{r.gameTitle ?? "ASG"}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">
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
