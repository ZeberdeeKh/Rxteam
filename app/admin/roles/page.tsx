import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requireMaster, ALL_PERMS } from "@/lib/admin";
import { listPlayers } from "@/lib/admin-data";
import { saveRoles } from "@/app/admin/actions";
import { ui, btn, badgeClass, Collapsible } from "@/components/ui";

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
    <div className={ui.pageStack}>
      {searchParams.saved && (
        <p className={ui.alertOk}>{st(lang, "adm_saved")}</p>
      )}

      <div className={ui.listStack}>
        {players.map((p) => {
          const roleBadge = p.is_master ? (
            <span className={badgeClass("brand")}>{st(lang, "adm_master")}</span>
          ) : p.is_admin || (Array.isArray(p.admin_perms) && p.admin_perms.length > 0) ? (
            <span className={badgeClass("green")}>{st(lang, "adm_role_admin")}</span>
          ) : (
            <span className={badgeClass("gray")}>{st(lang, "adm_role_player")}</span>
          );
          return (
            <Collapsible
              key={p.id}
              right={roleBadge}
              summary={
                <span className={ui.cardTitle}>
                  {p.callsign ?? p.name ?? `#${p.id}`}
                  {p.tg_username && <span className="ml-2 text-xs text-gray-400">@{p.tg_username}</span>}
                </span>
              }
            >
              <form action={saveRoles} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <input type="hidden" name="playerId" value={p.id} />
                {ALL_PERMS.map((perm) => (
                  <label key={perm} className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="perms"
                      value={perm}
                      defaultChecked={Array.isArray(p.admin_perms) && p.admin_perms.includes(perm)}
                      disabled={p.is_master}
                      className={ui.checkbox}
                    />
                    {st(lang, `adm_nav_${perm}`)}
                  </label>
                ))}
                {!p.is_master && (
                  <button type="submit" className={`ml-auto ${btn("action")}`}>
                    {st(lang, "adm_btn_save_roles")}
                  </button>
                )}
              </form>
            </Collapsible>
          );
        })}
      </div>

      {/* Легенда дозволів — пояснення для суперадміна, за що відповідає кожен прапорець. */}
      <section className={`${ui.card} text-sm`}>
        <h2 className={`mb-3 ${ui.cardTitle}`}>{st(lang, "adm_perms_legend_title")}</h2>
        <ul className="space-y-1.5 text-gray-600">
          {ALL_PERMS.map((perm) => (
            <li key={perm} className="flex flex-wrap gap-x-2">
              <code className="font-semibold text-[var(--c-brand-text)]">{perm}</code>
              <span>— {st(lang, `adm_perm_${perm}`)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
