import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { requireMaster, ALL_PERMS } from "@/lib/admin";
import { listPlayers } from "@/lib/admin-data";
import { saveRoles } from "@/app/admin/actions";
import { ui, btn, badgeClass, Collapsible } from "@/components/ui";

export const dynamic = "force-dynamic";

// Інфо-піктограма з підказкою (hover/focus) — пояснення дозволів. Без JS: чистий CSS group-hover.
// Рендериться як останній пункт у відкритому рядку редагування ролей.
function PermInfo({ lang }: { lang: Lang }) {
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label={st(lang, "adm_perms_legend_title")}
        className="cursor-help text-gray-400 transition-colors hover:text-[var(--c-brand-text)]"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
      <div
        role="tooltip"
        className="invisible absolute top-full right-0 z-20 mt-2 w-80 max-w-[85vw] border border-gray-200 bg-white p-3 text-left text-sm text-gray-600 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <p className="mb-2 text-sm font-semibold text-gray-800">{st(lang, "adm_perms_legend_title")}</p>
        <ul className="space-y-1">
          {ALL_PERMS.map((perm) => (
            <li key={perm}>
              <span className="font-semibold text-[var(--c-brand-text)]">{st(lang, `adm_nav_${perm}`)}</span>
              {" — "}
              {st(lang, `adm_perm_${perm}`)}
            </li>
          ))}
        </ul>
      </div>
    </span>
  );
}

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
                <div className="ml-auto flex items-center gap-3">
                  <PermInfo lang={lang} />
                  {!p.is_master && (
                    <button type="submit" className={btn("action")}>
                      {st(lang, "adm_btn_save_roles")}
                    </button>
                  )}
                </div>
              </form>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
