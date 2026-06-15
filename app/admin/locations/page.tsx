import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listLocationsFull } from "@/lib/admin-data";
import { createLocation, updateLocation, deleteLocation } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminLocations({
  searchParams,
}: {
  searchParams: { created?: string; saved?: string; deleted?: string; err?: string };
}) {
  await requirePerm("games");
  const lang = getServerLang();
  const locations = await listLocationsFull();
  const inputCls =
    "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none";

  const ok = searchParams.created || searchParams.saved || searchParams.deleted;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
        {st(lang, "adm_locations_title")}
      </h1>

      {ok && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, "adm_done")}</p>}
      {searchParams.err === "inuse" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{st(lang, "adm_loc_inuse")}</p>
      )}
      {searchParams.err === "fields" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{st(lang, "adm_err_fields")}</p>
      )}

      {/* Нова локація */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">{st(lang, "adm_loc_add")}</h2>
        <form action={createLocation} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-neutral-600">{st(lang, "adm_loc_name")}</span>
            <input name="name" required className={inputCls} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600">{st(lang, "adm_loc_lat")}</span>
            <input name="lat" type="number" step="any" required className={inputCls} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600">{st(lang, "adm_loc_lng")}</span>
            <input name="lng" type="number" step="any" required className={inputCls} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600">{st(lang, "adm_loc_radius")}</span>
            <input name="radius_m" type="number" min={10} defaultValue={300} className={inputCls} />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
              {st(lang, "adm_btn_create")}
            </button>
          </div>
        </form>
      </section>

      {/* Список локацій (правка + видалення) */}
      {locations.length === 0 ? (
        <p className="text-sm text-neutral-500">{st(lang, "adm_loc_empty")}</p>
      ) : (
        <div className="space-y-3">
          {locations.map((l) => (
            <div key={l.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <form action={updateLocation} className="grid items-end gap-3 sm:grid-cols-12">
                <input type="hidden" name="id" value={l.id} />
                <label className="text-sm sm:col-span-4">
                  <span className="mb-1 block text-xs text-neutral-500">{st(lang, "adm_loc_name")}</span>
                  <input name="name" defaultValue={l.name} required className={inputCls} />
                </label>
                <label className="text-sm sm:col-span-3">
                  <span className="mb-1 block text-xs text-neutral-500">{st(lang, "adm_loc_lat")}</span>
                  <input name="lat" type="number" step="any" defaultValue={l.lat} required className={inputCls} />
                </label>
                <label className="text-sm sm:col-span-3">
                  <span className="mb-1 block text-xs text-neutral-500">{st(lang, "adm_loc_lng")}</span>
                  <input name="lng" type="number" step="any" defaultValue={l.lng} required className={inputCls} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-xs text-neutral-500">{st(lang, "adm_loc_radius")}</span>
                  <input name="radius_m" type="number" min={10} defaultValue={l.radius_m} className={inputCls} />
                </label>
                <div className="flex items-center gap-2 sm:col-span-12">
                  <button
                    type="submit"
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-brand hover:text-brand"
                  >
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
                  <span className="ml-auto text-xs text-neutral-400">
                    {l.gameCount > 0 ? `${st(lang, "adm_col_reg")}: ${l.gameCount} 🎮` : ""}
                  </span>
                </div>
              </form>

              <form action={deleteLocation} className="mt-2 border-t border-neutral-100 pt-2">
                <input type="hidden" name="id" value={l.id} />
                <button
                  type="submit"
                  disabled={l.gameCount > 0}
                  title={l.gameCount > 0 ? st(lang, "adm_loc_inuse") : undefined}
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-600 transition hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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
