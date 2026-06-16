import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listLocationsFull, type AdminLocation } from "@/lib/admin-data";
import { createLocation, updateLocation, deleteLocation } from "@/app/admin/actions";
import { REPLICA_TYPES, PYRO_STATES, FIRE_MODES } from "@/lib/replicas";
import { ui, btn, GLYPH } from "@/components/ui";

export const dynamic = "force-dynamic";

// Ліміти локації: типи реплік + піро + уточнення + режим вогню + оплата.
// Самодостатній блок із власною 2-колонковою сіткою — НЕ залежить від колонок форми-батька,
// тому однаково рівний і у формі створення, і у правці.
function LimitControls({ lang, loc }: { lang: Lang; loc?: AdminLocation }) {
  const types = loc?.replica_types ?? [];
  const pyro = loc?.pyro ?? "no";
  const fire = loc?.fire_mode ?? "semi";
  const box = ui.fieldBox;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <fieldset className={`${box} sm:col-span-2`}>
        <legend className={ui.legend}>{st(lang, "adm_loc_replicas")}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {REPLICA_TYPES.map((t) => (
            <label key={t.code} className="inline-flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="replica_types"
                value={t.code}
                defaultChecked={types.includes(t.code)}
                className={ui.checkbox}
              />
              {lang === "uk" ? t.uk : lang === "pl" ? t.pl : t.en}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Піротехніка і Режим вогню — дві рівні половинки (однакова висота, симетрично). */}
      <fieldset className={box}>
        <legend className={ui.legend}>{st(lang, "adm_loc_pyro")}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {PYRO_STATES.map((v) => (
            <label key={v} className="inline-flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="pyro"
                value={v}
                defaultChecked={pyro === v}
                className={ui.radio}
              />
              {st(lang, `adm_pyro_${v}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={box}>
        <legend className={ui.legend}>{st(lang, "adm_loc_firemode")}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {FIRE_MODES.map((v) => (
            <label key={v} className="inline-flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="fire_mode"
                value={v}
                defaultChecked={fire === v}
                className={ui.radio}
              />
              {st(lang, `adm_fire_${v}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={`${box} sm:col-span-2`}>
        <legend className={ui.legend}>{st(lang, "adm_loc_pyro_note")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_loc_pyro_note_pl")}</span>
            <input name="pyro_note_pl" defaultValue={loc?.pyro_note_pl ?? ""} className={ui.input} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_loc_pyro_note_uk")}</span>
            <input name="pyro_note_uk" defaultValue={loc?.pyro_note_uk ?? ""} className={ui.input} />
          </label>
        </div>
      </fieldset>

      <fieldset className={`${box} sm:col-span-2`}>
        <legend className={ui.legend}>{st(lang, "adm_loc_payment")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_loc_payment_pl")}</span>
            <textarea name="payment_pl" rows={3} defaultValue={loc?.payment_pl ?? ""} className={ui.input} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_loc_payment_uk")}</span>
            <textarea name="payment_uk" rows={3} defaultValue={loc?.payment_uk ?? ""} className={ui.input} />
          </label>
        </div>
      </fieldset>
    </div>
  );
}

// Верхні поля (назва/координати/радіус) — однаковий рівний рядок у створенні й правці.
function TopFields({ lang, loc }: { lang: Lang; loc?: AdminLocation }) {
  return (
    <div className="grid gap-3 sm:grid-cols-12">
      <label className="text-sm sm:col-span-6">
        <span className={`mb-1 block ${ui.label}`}>{st(lang, "adm_loc_name")}</span>
        <input name="name" defaultValue={loc?.name ?? ""} required className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className={`mb-1 block ${ui.label}`}>{st(lang, "adm_loc_lat")}</span>
        <input name="lat" type="number" step="any" defaultValue={loc?.lat ?? ""} required className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className={`mb-1 block ${ui.label}`}>{st(lang, "adm_loc_lng")}</span>
        <input name="lng" type="number" step="any" defaultValue={loc?.lng ?? ""} required className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className={`mb-1 block ${ui.label}`}>{st(lang, "adm_loc_radius")}</span>
        <input name="radius_m" type="number" min={10} defaultValue={loc?.radius_m ?? 300} className={ui.input} />
      </label>
    </div>
  );
}

export default async function AdminLocations({
  searchParams,
}: {
  searchParams: { created?: string; saved?: string; deleted?: string; err?: string };
}) {
  await requirePerm("games");
  const lang = getServerLang();
  const locations = await listLocationsFull();

  const ok = searchParams.created || searchParams.saved || searchParams.deleted;

  return (
    <div className={ui.pageStack}>
      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "inuse" && <p className={ui.alertErr}>{st(lang, "adm_loc_inuse")}</p>}
      {searchParams.err === "fields" && <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>}

      {/* Нова локація */}
      <section className={ui.card}>
        <h2 className={`mb-4 ${ui.cardTitle}`}>{st(lang, "adm_loc_add")}</h2>
        <form action={createLocation} className="space-y-4">
          <TopFields lang={lang} />
          <LimitControls lang={lang} />
          <button type="submit" className={btn("action")}>
            {st(lang, "adm_btn_create")}
          </button>
        </form>
      </section>

      {/* Список локацій (правка + видалення) */}
      {locations.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_loc_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {locations.map((l) => (
            <div key={l.id} className={`${ui.card} space-y-4`}>
              {/* Форма правки. Кнопка «Зберегти» лежить нижче й прив'язана через form={id}. */}
              <form action={updateLocation} id={`loc-${l.id}`} className="space-y-4">
                <input type="hidden" name="id" value={l.id} />
                <TopFields lang={lang} loc={l} />
                <LimitControls lang={lang} loc={l} />
              </form>

              {/* Єдиний рівний ряд дій: action «Зберегти» + delete «Видалити». */}
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                <button type="submit" form={`loc-${l.id}`} className={btn("action")}>
                  {st(lang, "adm_btn_save")}
                </button>
                <form action={deleteLocation}>
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    disabled={l.gameCount > 0}
                    title={l.gameCount > 0 ? st(lang, "adm_loc_inuse") : undefined}
                    className={btn("delete")}
                  >
                    {st(lang, "adm_btn_delete")}
                  </button>
                </form>
                {l.map_url && (
                  <a
                    href={l.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm ${ui.link}`}
                  >
                    {st(lang, "games_map")}
                  </a>
                )}
                <span className="ml-auto text-xs text-gray-400">
                  {l.gameCount > 0 ? `${st(lang, "adm_col_reg")}: ${l.gameCount} ${GLYPH.game}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
