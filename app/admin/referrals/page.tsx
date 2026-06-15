import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listReferrals } from "@/lib/admin-data";
import { formatGameWhen } from "@/lib/games";
import { setReferralStatus } from "@/app/admin/actions";
import { ui, buttonClass, badgeClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminReferrals({ searchParams }: { searchParams: { saved?: string } }) {
  await requirePerm("referrals");
  const lang = getServerLang();
  const refs = await listReferrals();

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_referrals_title")}</h1>
      {searchParams.saved && (
        <p className={ui.alertOk}>{st(lang, "adm_saved")}</p>
      )}

      {refs.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_empty")}</p>
      ) : (
        <div className={`overflow-x-auto ${ui.tableWrap} bg-white`}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>{st(lang, "adm_inviter")}</th>
                <th className={ui.th}>{st(lang, "adm_invited")}</th>
                <th className={ui.th}>{st(lang, "adm_col_status")}</th>
                <th className={ui.th} />
              </tr>
            </thead>
            <tbody className={ui.tbody}>
              {refs.map((r) => (
                <tr key={r.id}>
                  <td className={`${ui.td} font-medium text-gray-900`}>{r.inviter}</td>
                  <td className={ui.td}>{r.invited}</td>
                  <td className={ui.td}>
                    <span
                      className={badgeClass(
                        r.status === "confirmed"
                          ? "green"
                          : r.status === "rejected"
                            ? "red"
                            : "amber",
                      )}
                    >
                      {r.status}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {formatGameWhen(r.created_at, lang)}
                    </span>
                  </td>
                  <td className={`${ui.td} text-right`}>
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <form action={setReferralStatus}>
                          <input type="hidden" name="refId" value={r.id} />
                          <input type="hidden" name="status" value="confirmed" />
                          <button type="submit" className={buttonClass("primary", "sm")}>
                            {st(lang, "adm_btn_confirm")}
                          </button>
                        </form>
                        <form action={setReferralStatus}>
                          <input type="hidden" name="refId" value={r.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button type="submit" className={buttonClass("danger", "sm")}>
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
