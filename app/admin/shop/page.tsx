import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { requireMaster } from "@/lib/admin";
import { listShopItemsAdmin, listPurchasesAdmin } from "@/lib/admin-data";
import type { ShopItem } from "@/lib/site-data";
import {
  createShopItem,
  updateShopItem,
  deleteShopItem,
  markFulfilled,
} from "@/app/admin/actions";
import { ui, btn, badgeClass, GLYPH, Collapsible, CreateDrawer } from "@/components/ui";

export const dynamic = "force-dynamic";

// Поля товару: спільні для форми створення (item відсутній → дефолти) і правки.
function ShopItemFields({ lang, item }: { lang: Lang; item?: ShopItem }) {
  return (
    <>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_shop_title_pl")}</span>
        <input name="title_pl" defaultValue={item?.title_pl ?? ""} className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_shop_title_uk")}</span>
        <input name="title_uk" defaultValue={item?.title_uk ?? ""} className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_shop_title_en")}</span>
        <input name="title_en" defaultValue={item?.title_en ?? ""} className={ui.input} />
      </label>

      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_shop_desc_pl")}</span>
        <textarea name="desc_pl" defaultValue={item?.desc_pl ?? ""} rows={2} className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_shop_desc_uk")}</span>
        <textarea name="desc_uk" defaultValue={item?.desc_uk ?? ""} rows={2} className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_shop_desc_en")}</span>
        <textarea name="desc_en" defaultValue={item?.desc_en ?? ""} rows={2} className={ui.input} />
      </label>

      <label className="text-sm sm:col-span-3">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_shop_cost")}</span>
        <input name="cost" type="number" min={0} defaultValue={item?.cost ?? 0} className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-3">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_shop_sort")}</span>
        <input name="sort" type="number" defaultValue={item?.sort ?? 0} className={ui.input} />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-6 sm:pt-6">
        <input
          type="checkbox"
          name="active"
          defaultChecked={item?.active ?? true}
          className={ui.checkbox}
        />
        <span className={ui.meta}>{st(lang, "adm_shop_active")}</span>
      </label>
    </>
  );
}

function pickTitle(
  t: { pl: string | null; en: string | null; uk: string | null } | null,
  lang: Lang,
): string {
  if (!t) return "—";
  return (lang === "pl" ? t.pl : lang === "uk" ? t.uk : t.en) ?? t.pl ?? t.en ?? t.uk ?? "—";
}

// Дата покупки у форматі YYYY-MM-DD HH:MM (UTC, для внутрішнього журналу).
function fmtDate(iso: string): string {
  return iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : "—";
}

export default async function AdminShop({
  searchParams,
}: {
  searchParams: {
    created?: string;
    saved?: string;
    deleted?: string;
    fulfilled?: string;
    err?: string;
  };
}) {
  await requireMaster();
  const lang = getServerLang();
  const [items, orders] = await Promise.all([listShopItemsAdmin(), listPurchasesAdmin()]);

  const ok =
    searchParams.created || searchParams.saved || searchParams.deleted || searchParams.fulfilled;

  return (
    <div className={ui.pageStack}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* Кнопка відкриває бокову панель із формою нового товару. */}
        <CreateDrawer
          label={st(lang, "adm_shop_add")}
          title={st(lang, "adm_shop_add")}
          closeLabel={st(lang, "adm_close")}
          className="sm:max-w-3xl"
        >
          <form action={createShopItem} className="grid items-end gap-3 sm:grid-cols-12">
            <ShopItemFields lang={lang} />
            <div className="flex items-end sm:col-span-12">
              <button type="submit" className={btn("action")}>
                {st(lang, "adm_btn_create")}
              </button>
            </div>
          </form>
        </CreateDrawer>
      </div>

      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "fields" && <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>}

      {/* Список товарів — компактні рядки, що розгортають форму правки (як меню «Гравці»). */}
      {items.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_shop_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {items.map((it) => (
            <Collapsible
              key={it.id}
              right={!it.active ? <span className={badgeClass("gray")}>{st(lang, "adm_shop_hidden")}</span> : null}
              summary={
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={ui.cardTitle}>
                    {pickTitle({ pl: it.title_pl, en: it.title_en, uk: it.title_uk }, lang)}
                  </span>
                  <span className={ui.metaFaint}>
                    {it.cost} {GLYPH.balance}
                  </span>
                </div>
              }
            >
              <div className="space-y-3">
                <form action={updateShopItem} id={`shop-${it.id}`} className="grid items-end gap-3 sm:grid-cols-12">
                  <input type="hidden" name="id" value={it.id} />
                  <ShopItemFields lang={lang} item={it} />
                </form>

                {/* Єдиний рівний ряд дій: action «Зберегти» + delete «Видалити». */}
                <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                  <button type="submit" form={`shop-${it.id}`} className={btn("action")}>
                    {st(lang, "adm_btn_save")}
                  </button>
                  <form action={deleteShopItem}>
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

      {/* Журнал покупок */}
      <section className="space-y-3">
        <h2 className={ui.sectionTitle}>{st(lang, "adm_shop_orders_title")}</h2>
        {orders.length === 0 ? (
          <p className={ui.muted}>{st(lang, "adm_shop_orders_empty")}</p>
        ) : (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>{st(lang, "adm_shop_col_player")}</th>
                  <th className={ui.th}>{st(lang, "adm_shop_col_item")}</th>
                  <th className={ui.th}>{st(lang, "adm_shop_col_cost")}</th>
                  <th className={ui.th}>{st(lang, "adm_shop_col_date")}</th>
                  <th className={ui.th}>{st(lang, "adm_shop_col_status")}</th>
                </tr>
              </thead>
              <tbody className={ui.tbody}>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className={ui.td}>{o.callsign ?? o.name ?? "—"}</td>
                    <td className={ui.td}>{pickTitle(o.itemTitle, lang)}</td>
                    <td className={ui.td}>{o.cost} 💰</td>
                    <td className={ui.td}>{fmtDate(o.created_at)}</td>
                    <td className={ui.td}>
                      {o.fulfilled ? (
                        <span className={badgeClass("green")}>
                          {st(lang, "adm_shop_status_done")}
                        </span>
                      ) : (
                        <form action={markFulfilled} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={o.id} />
                          <span className={badgeClass("amber")}>
                            {st(lang, "adm_shop_status_pending")}
                          </span>
                          <button type="submit" className={btn("action", "sm")}>
                            {st(lang, "adm_shop_mark_done")}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
