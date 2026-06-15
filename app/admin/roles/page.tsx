import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requireMaster, ALL_PERMS } from "@/lib/admin";
import { listPlayers } from "@/lib/admin-data";
import { saveRoles } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminRoles({
  searchParams,
}: {
  searchParams: { saved?: string; err?: string };
}) {
  await requireMaster();
  const lang = getServerLang();
  // Лише адміни: майстер, is_admin або хтось із правами. Звичайних гравців тут не показуємо
  // (їх призначають адмінами на сторінці «Гравці»).
  const players = (await listPlayers()).filter(
    (p) => p.is_master || p.is_admin || (Array.isArray(p.admin_perms) && p.admin_perms.length > 0),
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "adm_roles_title")}</h1>
      <p className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600">
        {st(lang, "adm_roles_help")}
      </p>
      {searchParams.saved && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, "adm_saved")}</p>
      )}

      <div className="space-y-3">
        {players.map((p) => (
          <form
            key={p.id}
            action={saveRoles}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <input type="hidden" name="playerId" value={p.id} />
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-semibold text-gray-900">
                {p.callsign ?? p.name ?? `#${p.id}`}
                {p.tg_username && <span className="ml-2 text-xs text-gray-400">@{p.tg_username}</span>}
              </span>
              {p.is_master ? (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
                  {st(lang, "adm_master")}
                </span>
              ) : p.is_admin || (Array.isArray(p.admin_perms) && p.admin_perms.length > 0) ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {st(lang, "adm_role_admin")}
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {st(lang, "adm_role_player")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {ALL_PERMS.map((perm) => (
                <label key={perm} className="flex items-center gap-1 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="perms"
                    value={perm}
                    defaultChecked={Array.isArray(p.admin_perms) && p.admin_perms.includes(perm)}
                    disabled={p.is_master}
                    className="h-4 w-4 accent-brand"
                  />
                  {perm}
                </label>
              ))}
              {!p.is_master && (
                <button
                  type="submit"
                  className="ml-auto rounded-md bg-brand px-3 py-1 text-xs font-medium text-neutral-50 hover:bg-brand-dark"
                >
                  {st(lang, "adm_btn_save_roles")}
                </button>
              )}
            </div>
          </form>
        ))}
      </div>

      {/* Легенда дозволів — пояснення для суперадміна, за що відповідає кожен прапорець. */}
      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <h2 className="mb-2 font-semibold text-gray-800">{st(lang, "adm_perms_legend_title")}</h2>
        <ul className="space-y-1.5 text-gray-600">
          {ALL_PERMS.map((perm) => (
            <li key={perm} className="flex flex-wrap gap-x-2">
              <code className="font-mono font-semibold text-brand-dark">{perm}</code>
              <span>— {st(lang, `adm_perm_${perm}`)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
