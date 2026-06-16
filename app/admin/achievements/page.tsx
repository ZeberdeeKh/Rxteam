import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { requireMaster } from "@/lib/admin";
import {
  listAchievementsAdmin,
  listPlayerAchievementsAdmin,
  type AdminAchievement,
} from "@/lib/admin-data";
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "@/app/admin/actions";
import { ui, btn, badgeClass, GLYPH, Collapsible, CreateDrawer, type BadgeColor } from "@/components/ui";
import AchievementIconUploader from "@/components/admin/AchievementIconUploader";

export const dynamic = "force-dynamic";

// Колір бейджа за рівнем ачівки (бали ростуть easy → hard).
const TIER_BADGE: Record<string, BadgeColor> = { easy: "green", mid: "amber", hard: "red" };
const TIER_KEY: Record<string, "adm_ach_tier_easy" | "adm_ach_tier_mid" | "adm_ach_tier_hard"> = {
  easy: "adm_ach_tier_easy",
  mid: "adm_ach_tier_mid",
  hard: "adm_ach_tier_hard",
};

// Поля ачівки: спільні для форми створення (item відсутній → дефолти) і правки.
// Код — первинний ключ: на правці лише читається (його тримає player_achievements).
function AchievementFields({ lang, item }: { lang: Lang; item?: AdminAchievement }) {
  return (
    <>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_ach_code")}</span>
        <input
          name="code"
          defaultValue={item?.code ?? ""}
          readOnly={!!item}
          placeholder="deploy_100"
          className={`${ui.input} ${item ? "opacity-60" : ""}`}
        />
      </label>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_ach_tier")}</span>
        <select name="tier" defaultValue={item?.tier ?? "mid"} className={ui.input}>
          <option value="easy">{st(lang, "adm_ach_tier_easy")}</option>
          <option value="mid">{st(lang, "adm_ach_tier_mid")}</option>
          <option value="hard">{st(lang, "adm_ach_tier_hard")}</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-4 sm:pt-6">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={item?.enabled ?? true}
          className={ui.checkbox}
        />
        <span className={ui.meta}>{st(lang, "adm_ach_enabled")}</span>
      </label>

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

      {/* Вид ачівки: auto (код-тригер) лише на правці; на створенні завжди manual (locked). */}
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_ach_kind")}</span>
        <select
          name="kind"
          defaultValue={item?.kind ?? "manual"}
          disabled={!item}
          className={`${ui.input} ${!item ? "opacity-60" : ""}`}
        >
          <option value="manual">{st(lang, "adm_ach_kind_manual")}</option>
          <option value="auto">{st(lang, "adm_ach_kind_auto")}</option>
        </select>
      </label>
      <p className={`self-center ${ui.meta} sm:col-span-8`}>
        {st(
          lang,
          (item?.kind ?? "manual") === "auto" ? "adm_ach_kind_auto_hint" : "adm_ach_kind_manual_hint",
        )}
      </p>

      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_ach_desc_pl")}</span>
        <textarea name="description_pl" defaultValue={item?.description_pl ?? ""} rows={2} className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_ach_desc_uk")}</span>
        <textarea name="description_uk" defaultValue={item?.description_uk ?? ""} rows={2} className={ui.input} />
      </label>
      <label className="text-sm sm:col-span-4">
        <span className={`mb-1 block ${ui.meta}`}>{st(lang, "adm_ach_desc_en")}</span>
        <textarea name="description_en" defaultValue={item?.description_en ?? ""} rows={2} className={ui.input} />
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

// Дата здобуття у форматі YYYY-MM-DD HH:MM (UTC, для внутрішнього журналу).
function fmtDate(iso: string): string {
  return iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : "—";
}

export default async function AdminAchievements({
  searchParams,
}: {
  searchParams: {
    created?: string;
    saved?: string;
    deleted?: string;
    err?: string;
  };
}) {
  await requireMaster();
  const lang = getServerLang();
  const [items, log] = await Promise.all([
    listAchievementsAdmin(),
    listPlayerAchievementsAdmin(),
  ]);

  const ok = searchParams.created || searchParams.saved || searchParams.deleted;

  return (
    <div className={ui.pageStack}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* Кнопка відкриває бокову панель із формою нової ачівки. */}
        <CreateDrawer
          label={st(lang, "adm_ach_add")}
          title={st(lang, "adm_ach_add")}
          closeLabel={st(lang, "adm_close")}
          className="sm:max-w-3xl"
        >
          <form action={createAchievement} className="grid items-end gap-3 sm:grid-cols-12">
            <AchievementFields lang={lang} />
            <div className="flex flex-col gap-2 sm:col-span-12">
              <p className={ui.meta}>{st(lang, "adm_ach_thumb_create_hint")}</p>
              <button type="submit" className={`${btn("action")} self-start`}>
                {st(lang, "adm_btn_create")}
              </button>
            </div>
          </form>
        </CreateDrawer>
      </div>

      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "fields" && <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>}
      {searchParams.err === "dup" && <p className={ui.alertErr}>{st(lang, "adm_ach_err_dup")}</p>}
      {searchParams.err === "inuse" && <p className={ui.alertErr}>{st(lang, "adm_ach_err_inuse")}</p>}

      {/* Каталог ачівок — компактні рядки, що розгортають форму правки. */}
      {items.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_ach_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {items.map((it) => (
            <Collapsible
              key={it.code}
              right={
                <div className="flex items-center gap-1.5">
                  {!it.enabled && (
                    <span className={badgeClass("gray")}>{st(lang, "adm_ach_disabled")}</span>
                  )}
                  <span className={badgeClass(it.kind === "auto" ? "brand" : "gray")}>
                    {st(lang, it.kind === "auto" ? "adm_ach_kind_auto" : "adm_ach_kind_manual")}
                  </span>
                  <span className={badgeClass(TIER_BADGE[it.tier] ?? "gray")}>
                    {st(lang, TIER_KEY[it.tier] ?? "adm_ach_tier_mid")}
                  </span>
                </div>
              }
              summary={
                <div className="flex items-start gap-2">
                  {it.thumbnail_svg ? (
                    // base64 data URL → інертний <img> (XSS-safe), див. Етап 20.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.thumbnail_svg} alt="" className="h-7 w-7 shrink-0 object-contain" loading="lazy" />
                  ) : (
                    <span aria-hidden className="text-lg leading-none">
                      {GLYPH.rank}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className={ui.cardTitle}>
                        {pickTitle({ pl: it.title_pl, en: it.title_en, uk: it.title_uk }, lang)}
                      </span>
                      <span className={ui.metaFaint}>{it.code}</span>
                      {it.earnedCount > 0 && (
                        <span className={ui.metaFaint}>· {it.earnedCount}</span>
                      )}
                    </div>
                    {pickTitle({ pl: it.description_pl, en: it.description_en, uk: it.description_uk }, lang) !==
                      "—" && (
                      <p className={`mt-0.5 ${ui.meta}`}>
                        {pickTitle(
                          { pl: it.description_pl, en: it.description_en, uk: it.description_uk },
                          lang,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              }
            >
              <div className="space-y-3">
                <form
                  action={updateAchievement}
                  id={`ach-${it.code}`}
                  className="grid items-end gap-3 sm:grid-cols-12"
                >
                  <AchievementFields lang={lang} item={it} />
                </form>

                {/* SVG-мініатюра — окремий канал (route handler), поза server-action формою. */}
                <AchievementIconUploader lang={lang} code={it.code} current={it.thumbnail_svg} />

                {/* Ряд дій: «Зберегти» завжди; «Видалити» лише поки ачівку ніхто не здобув. */}
                <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                  <button type="submit" form={`ach-${it.code}`} className={btn("action")}>
                    {st(lang, "adm_btn_save")}
                  </button>
                  {it.earnedCount > 0 ? (
                    <span className={ui.metaFaint}>{st(lang, "adm_ach_earned_hint")}</span>
                  ) : (
                    <form action={deleteAchievement}>
                      <input type="hidden" name="code" value={it.code} />
                      <button type="submit" className={btn("delete")}>
                        {st(lang, "adm_btn_delete")}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Журнал здобутих ачівок */}
      <section className="space-y-3">
        <h2 className={ui.sectionTitle}>{st(lang, "adm_ach_log_title")}</h2>
        {log.length === 0 ? (
          <p className={ui.muted}>{st(lang, "adm_ach_log_empty")}</p>
        ) : (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>{st(lang, "adm_ach_col_player")}</th>
                  <th className={ui.th}>{st(lang, "adm_ach_col_ach")}</th>
                  <th className={ui.th}>{st(lang, "adm_ach_col_code")}</th>
                  <th className={ui.th}>{st(lang, "adm_ach_col_date")}</th>
                </tr>
              </thead>
              <tbody className={ui.tbody}>
                {log.map((r) => (
                  <tr key={r.id}>
                    <td className={ui.td}>{r.callsign ?? r.name ?? "—"}</td>
                    <td className={ui.td}>{pickTitle(r.achTitle, lang)}</td>
                    <td className={ui.td}>{r.code}</td>
                    <td className={ui.td}>{fmtDate(r.created_at)}</td>
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
