import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listLocationsFull, type AdminLocation } from "@/lib/admin-data";
import { createLocation, updateLocation, deleteLocation } from "@/app/admin/actions";
import { REPLICA_TYPES, PYRO_STATES, FIRE_MODES } from "@/lib/replicas";
import { ui, btn, badgeClass, GLYPH, Collapsible, CreateDrawer } from "@/components/ui";

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

      {/* Посилання на YouTube-відео локації — одне поле (мова відео не важлива). */}
      <fieldset className={`${box} sm:col-span-2`}>
        <legend className={ui.legend}>{st(lang, "adm_loc_youtube")}</legend>
        <input
          name="youtube_url"
          type="url"
          inputMode="url"
          placeholder="https://youtu.be/…"
          defaultValue={loc?.youtube_url ?? ""}
          className={ui.input}
        />
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
  await requirePerm("locations");
  const lang = getServerLang();
  const locations = await listLocationsFull();

  const ok = searchParams.created || searchParams.saved || searchParams.deleted;

  return (
    <div className={ui.pageStack}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* Кнопка відкриває бокову панель із формою нової локації. */}
        <CreateDrawer
          label={st(lang, "adm_loc_add")}
          title={st(lang, "adm_loc_add")}
          closeLabel={st(lang, "adm_close")}
          className="sm:max-w-3xl"
        >
          <form action={createLocation} className="space-y-4">
            <TopFields lang={lang} />
            <LimitControls lang={lang} />
            <button type="submit" className={btn("action")}>
              {st(lang, "adm_btn_create")}
            </button>
          </form>
        </CreateDrawer>
      </div>

      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "inuse" && <p className={ui.alertErr}>{st(lang, "adm_loc_inuse")}</p>}
      {searchParams.err === "fields" && <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>}

      {/* Список локацій — компактні рядки, що розгортають форму правки (як меню «Гравці»). */}
      {locations.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_loc_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {locations.map((l) => (
            <Collapsible
              key={l.id}
              right={
                l.gameCount > 0 ? (
                  <span className={badgeClass("gray")}>
                    {l.gameCount} {GLYPH.game}
                  </span>
                ) : null
              }
              summary={
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={ui.cardTitle}>{l.name}</span>
                  <span className={ui.metaFaint}>
                    {l.lat}, {l.lng}
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
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
                </div>
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
