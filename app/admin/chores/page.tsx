import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { requireMaster } from "@/lib/admin";
import { listChoreTemplates } from "@/lib/admin-data";
import { createChore, updateChore, deleteChore } from "@/app/admin/actions";
import { ui, btn } from "@/components/ui";

export const dynamic = "force-dynamic";

// Каталог пунктів чек-листа підготовки до гри (майстер-онлі). Знімок беремо при анонсі гри,
// тож правка/видалення тут не зачіпає вже відправлені списки.
function KindSelect({ lang, value }: { lang: Lang; value?: string }) {
  return (
    <select name="kind" defaultValue={value ?? "action"} className={ui.input}>
      <option value="action">{st(lang, "adm_chore_kind_action")}</option>
      <option value="gear">{st(lang, "adm_chore_kind_gear")}</option>
    </select>
  );
}

export default async function AdminChores({
  searchParams,
}: {
  searchParams: { created?: string; saved?: string; deleted?: string; err?: string };
}) {
  await requireMaster();
  const lang = getServerLang();
  const items = await listChoreTemplates();
  const ok = searchParams.created || searchParams.saved || searchParams.deleted;

  return (
    <div className={ui.pageStack}>
      <p className={ui.muted}>{st(lang, "adm_chores_hint")}</p>

      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "fields" && <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>}

      {/* Нова позиція */}
      <section className={ui.card}>
        <h2 className={`mb-3 ${ui.cardTitle}`}>{st(lang, "adm_chore_add")}</h2>
        <form action={createChore} className="grid items-end gap-3 sm:grid-cols-12">
          <label className="text-sm sm:col-span-3">
            <span className={ui.fieldLabel}>{st(lang, "adm_chore_kind")}</span>
            <KindSelect lang={lang} />
          </label>
          <label className="text-sm sm:col-span-6">
            <span className={ui.fieldLabel}>{st(lang, "adm_chore_label")}</span>
            <input name="label" required className={ui.input} />
          </label>
          <label className="text-sm sm:col-span-3">
            <span className={ui.fieldLabel}>{st(lang, "adm_chore_sort")}</span>
            <input name="sort_order" type="number" defaultValue={0} className={ui.input} />
          </label>
          <label className="text-sm sm:col-span-12">
            <span className={ui.fieldLabel}>{st(lang, "adm_chore_note")}</span>
            <input name="note" className={ui.input} />
          </label>
          <div className="flex items-end sm:col-span-12">
            <button type="submit" className={btn("action")}>
              {st(lang, "adm_btn_create")}
            </button>
          </div>
        </form>
      </section>

      {/* Список позицій (правка + видалення) */}
      {items.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_chore_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {items.map((it) => (
            <div key={it.id} className={`${ui.card} space-y-3`}>
              <form action={updateChore} id={`chore-${it.id}`} className="grid items-end gap-3 sm:grid-cols-12">
                <input type="hidden" name="id" value={it.id} />
                <label className="text-sm sm:col-span-3">
                  <span className={ui.fieldLabel}>{st(lang, "adm_chore_kind")}</span>
                  <KindSelect lang={lang} value={it.kind} />
                </label>
                <label className="text-sm sm:col-span-5">
                  <span className={ui.fieldLabel}>{st(lang, "adm_chore_label")}</span>
                  <input name="label" defaultValue={it.label} required className={ui.input} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className={ui.fieldLabel}>{st(lang, "adm_chore_sort")}</span>
                  <input name="sort_order" type="number" defaultValue={it.sort_order} className={ui.input} />
                </label>
                <label className="text-sm sm:col-span-12">
                  <span className={ui.fieldLabel}>{st(lang, "adm_chore_note")}</span>
                  <input name="note" defaultValue={it.note ?? ""} className={ui.input} />
                </label>
                <label className="inline-flex items-center gap-1.5 text-sm sm:col-span-12">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={it.active}
                    className={ui.checkbox}
                  />
                  {st(lang, "adm_chore_active")}
                </label>
              </form>

              {/* Єдиний рівний ряд дій: action «Зберегти» + delete «Видалити» (однаковий розмір). */}
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                <button type="submit" form={`chore-${it.id}`} className={btn("action")}>
                  {st(lang, "adm_btn_save")}
                </button>
                <form action={deleteChore}>
                  <input type="hidden" name="id" value={it.id} />
                  <button type="submit" className={btn("delete")}>
                    {st(lang, "adm_btn_delete")}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
