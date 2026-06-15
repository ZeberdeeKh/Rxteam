import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listLocationsFull } from "@/lib/admin-data";
import { createLocation, updateLocation, deleteLocation } from "@/app/admin/actions";
import { ui, buttonClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminLocations({
  searchParams,
}: {
  searchParams: { created?: string; saved?: string; deleted?: string; err?: string };
}) {
  await requirePerm("games");
  const lang = getServerLang();
  const locations = await listLocationsFull();
  const inputCls = ui.input;

  const ok = searchParams.created || searchParams.saved || searchParams.deleted;

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>
        {st(lang, "adm_locations_title")}
      </h1>

      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "inuse" && (
        <p className={ui.alertErr}>{st(lang, "adm_loc_inuse")}</p>
      )}
      {searchParams.err === "fields" && (
        <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>
      )}

      {/* Нова локація */}
      <section className={ui.card}>
        <h2 className={`mb-3 ${ui.cardTitle}`}>{st(lang, "adm_loc_add")}</h2>
        <form action={createLocation} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_loc_name")}</span>
            <input name="name" required className={inputCls} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_loc_lat")}</span>
            <input name="lat" type="number" step="any" required className={inputCls} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_loc_lng")}</span>
            <input name="lng" type="number" step="any" required className={inputCls} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 ${ui.label}`}>{st(lang, "adm_loc_radius")}</span>
            <input name="radius_m" type="number" min={10} defaultValue={300} className={inputCls} />
          </label>
          <div className="flex items-end">
            <button type="submit" className={buttonClass("primary", "md")}>
              {st(lang, "adm_btn_create")}
            </button>
          </div>
        </form>
      </section>

      {/* Список локацій (правка + видалення) */}
      {locations.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_loc_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {locations.map((l) => (
            <div key={l.id} className={ui.card}>
              <form action={updateLocation} className="grid items-end gap-3 sm:grid-cols-12">
                <input type="hidden" name="id" value={l.id} />
                <label className="text-sm sm:col-span-4">
                  <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_loc_name")}</span>
                  <input name="name" defaultValue={l.name} required className={inputCls} />
                </label>
                <label className="text-sm sm:col-span-3">
                  <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_loc_lat")}</span>
                  <input name="lat" type="number" step="any" defaultValue={l.lat} required className={inputCls} />
                </label>
                <label className="text-sm sm:col-span-3">
                  <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_loc_lng")}</span>
                  <input name="lng" type="number" step="any" defaultValue={l.lng} required className={inputCls} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_loc_radius")}</span>
                  <input name="radius_m" type="number" min={10} defaultValue={l.radius_m} className={inputCls} />
                </label>
                <div className="flex items-center gap-2 sm:col-span-12">
                  <button type="submit" className={buttonClass("secondary", "sm")}>
                    {st(lang, "adm_btn_save")}
                  </button>
                  {l.map_url && (
                    <a
                      href={l.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand hover:underline"
                    >
                      {st(lang, "games_map")}
                    </a>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    {l.gameCount > 0 ? `${st(lang, "adm_col_reg")}: ${l.gameCount} 🎮` : ""}
                  </span>
                </div>
              </form>

              <form action={deleteLocation} className="mt-2 border-t border-gray-100 pt-2">
                <input type="hidden" name="id" value={l.id} />
                <button
                  type="submit"
                  disabled={l.gameCount > 0}
                  title={l.gameCount > 0 ? st(lang, "adm_loc_inuse") : undefined}
                  className={buttonClass("danger", "sm")}
                >
                  {st(lang, "adm_btn_delete")}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
