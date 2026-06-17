import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listChoreTemplates } from "@/lib/admin-data";
import { createChore, updateChore, deleteChore } from "@/app/admin/actions";
import { ui, btn, badgeClass, Collapsible, CreateDrawer } from "@/components/ui";

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

// Поля пункту — спільні для форми створення (item відсутній → дефолти) і правки.
function ChoreFields({ lang, value }: { lang: Lang; value?: { kind: string; label: string; sort_order: number; note: string | null } }) {
  return (
    <div className="grid items-end gap-3 sm:grid-cols-12">
      <label className="text-sm sm:col-span-4">
        <span className={ui.fieldLabel}>{st(lang, "adm_chore_kind")}</span>
        <KindSelect lang={lang} value={value?.kind} />
      </label>
      <label className="text-sm sm:col-span-5">
        <span className={ui.fieldLabel}>{st(lang, "adm_chore_label")}</span>
        <input name="label" defaultValue={value?.label ?? ""} required className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-3">
        <span className={ui.fieldLabel}>{st(lang, "adm_chore_sort")}</span>
        <input name="sort_order" type="number" defaultValue={value?.sort_order ?? 0} className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-12">
        <span className={ui.fieldLabel}>{st(lang, "adm_chore_note")}</span>
        <input name="note" defaultValue={value?.note ?? ""} className={ui.input} />
      </label>
    </div>
  );
}

export default async function AdminChores({
  searchParams,
}: {
  searchParams: { created?: string; saved?: string; deleted?: string; err?: string };
}) {
  await requirePerm("chores");
  const lang = getServerLang();
  const items = await listChoreTemplates();
  const ok = searchParams.created || searchParams.saved || searchParams.deleted;

  return (
    <div className={ui.pageStack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={ui.muted}>{st(lang, "adm_chores_hint")}</p>
        {/* Кнопка відкриває бокову панель із формою нового пункту. */}
        <CreateDrawer label={st(lang, "adm_chore_add")} title={st(lang, "adm_chore_add")} closeLabel={st(lang, "adm_close")}>
          <form action={createChore} className="space-y-4">
            <ChoreFields lang={lang} />
            <button type="submit" className={btn("action")}>
              {st(lang, "adm_btn_create")}
            </button>
          </form>
        </CreateDrawer>
      </div>

      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "fields" && <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>}

      {/* Список позицій — компактні рядки, що розгортають форму правки (як меню «Гравці»). */}
      {items.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_chore_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {items.map((it) => (
            <Collapsible
              key={it.id}
              right={!it.active ? <span className={badgeClass("gray")}>{st(lang, "adm_chore_hidden")}</span> : null}
              summary={
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={ui.cardTitle}>{it.label}</span>
                  <span className={ui.metaFaint}>
                    {st(lang, it.kind === "gear" ? "adm_chore_kind_gear" : "adm_chore_kind_action")}
                  </span>
                </div>
              }
            >
              <div className="space-y-3">
                <form action={updateChore} id={`chore-${it.id}`} className="space-y-4">
                  <input type="hidden" name="id" value={it.id} />
                  <ChoreFields lang={lang} value={it} />
                  <label className="inline-flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="active" defaultChecked={it.active} className={ui.checkbox} />
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
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
