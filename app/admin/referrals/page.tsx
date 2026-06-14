import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listReferrals } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";
import { setReferralStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminReferrals({ searchParams }: { searchParams: { saved?: string } }) {
  await requirePerm("referrals");
  const lang = getServerLang();
  const refs = await listReferrals();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "adm_referrals_title")}</h1>
      {searchParams.saved && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, "adm_saved")}</p>
      )}

      {refs.length === 0 ? (
        <p className="text-sm text-neutral-500">{st(lang, "adm_empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-2 font-medium">{st(lang, "adm_inviter")}</th>
                <th className="px-3 py-2 font-medium">{st(lang, "adm_invited")}</th>
                <th className="px-3 py-2 font-medium">{st(lang, "adm_col_status")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-neutral-900">{r.inviter}</td>
                  <td className="px-3 py-2 text-neutral-700">{r.invited}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : r.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="ml-2 text-xs text-neutral-400">
                      {formatGameWhen(r.created_at, lang)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <form action={setReferralStatus}>
                          <input type="hidden" name="refId" value={r.id} />
                          <input type="hidden" name="status" value="confirmed" />
                          <button type="submit" className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-dark">
                            {st(lang, "adm_btn_confirm")}
                          </button>
                        </form>
                        <form action={setReferralStatus}>
                          <input type="hidden" name="refId" value={r.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button type="submit" className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs hover:border-red-400 hover:text-red-600">
                            {st(lang, "adm_btn_reject")}
                          </button>
                        </form>
                      </div>
                    )}
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
