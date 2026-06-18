import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listFaqItems, type FaqItem } from "@/lib/admin-data";
import { createFaq, updateFaq, deleteFaq } from "@/app/admin/actions";
import { ui, btn, badgeClass, Collapsible, CreateDrawer } from "@/components/ui";

export const dynamic = "force-dynamic";

// Поля одного питання FAQ: питання (3 мови) + відповідь (3 мови) + порядок + показ.
// UA — обов'язкове (мова-фолбек); PL/EN можна лишити порожнім (сайт відкотиться на UA/PL).
function FaqFields({ lang, item }: { lang: Lang; item?: FaqItem }) {
  return (
    <div className="space-y-3">
      <fieldset className={ui.fieldBox}>
        <legend className={ui.legend}>{st(lang, "adm_faq_question")}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>UA</span>
            <input name="question_uk" defaultValue={item?.question_uk ?? ""} required className={ui.input} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>PL</span>
            <input name="question_pl" defaultValue={item?.question_pl ?? ""} className={ui.input} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>EN</span>
            <input name="question_en" defaultValue={item?.question_en ?? ""} className={ui.input} />
          </label>
        </div>
      </fieldset>

      <fieldset className={ui.fieldBox}>
        <legend className={ui.legend}>{st(lang, "adm_faq_answer")}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>UA</span>
            <textarea name="answer_uk" rows={4} defaultValue={item?.answer_uk ?? ""} required className={ui.input} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>PL</span>
            <textarea name="answer_pl" rows={4} defaultValue={item?.answer_pl ?? ""} className={ui.input} />
          </label>
          <label className="text-sm">
            <span className={`mb-1 block ${ui.meta}`}>EN</span>
            <textarea name="answer_en" rows={4} defaultValue={item?.answer_en ?? ""} className={ui.input} />
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_faq_sort")}</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className={`${ui.input} w-28`}
          />
        </label>
        <label className="inline-flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className={ui.checkbox} />
          {st(lang, "adm_faq_active")}
        </label>
      </div>
    </div>
  );
}

export default async function AdminFaq({
  searchParams,
}: {
  searchParams: { created?: string; saved?: string; deleted?: string; err?: string };
}) {
  await requirePerm("faq");
  const lang = getServerLang();
  const items = await listFaqItems();

  const ok = searchParams.created || searchParams.saved || searchParams.deleted;

  return (
    <div className={ui.pageStack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={ui.muted}>{st(lang, "adm_faq_hint")}</p>
        <CreateDrawer
          label={st(lang, "adm_faq_add")}
          title={st(lang, "adm_faq_add")}
          closeLabel={st(lang, "adm_close")}
          className="sm:max-w-3xl"
        >
          <form action={createFaq} className="space-y-4">
            <FaqFields lang={lang} />
            <button type="submit" className={btn("action")}>
              {st(lang, "adm_btn_create")}
            </button>
          </form>
        </CreateDrawer>
      </div>

      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "fields" && <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>}

      {items.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_faq_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {items.map((it) => (
            <Collapsible
              key={it.id}
              right={
                !it.active ? <span className={badgeClass("gray")}>{st(lang, "adm_faq_hidden")}</span> : null
              }
              summary={
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={ui.metaFaint}>#{it.sort_order}</span>
                  <span className={ui.cardTitle}>{it.question_uk}</span>
                </div>
              }
            >
              <div className="space-y-4">
                <form action={updateFaq} id={`faq-${it.id}`} className="space-y-4">
                  <input type="hidden" name="id" value={it.id} />
                  <FaqFields lang={lang} item={it} />
                </form>

                <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                  <button type="submit" form={`faq-${it.id}`} className={btn("action")}>
                    {st(lang, "adm_btn_save")}
                  </button>
                  <form action={deleteFaq}>
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
