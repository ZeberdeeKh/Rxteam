import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { getAllSettings } from "@/lib/settings";
import { PATCH_SETTINGS_GROUPS, SETTING_DEFAULTS } from "@/lib/admin-settings";
import {
  approvePatchRequest,
  rejectPatchRequest,
  handPatchRequest,
  savePatchSettings,
} from "@/app/admin/actions";
import { supabase } from "@/lib/supabase";
import { formatGameWhen } from "@/lib/games";
import { ui, btn, badgeClass, Collapsible } from "@/components/ui";

export const dynamic = "force-dynamic";

// Система патчів (право "patch"): керування заявками (схвалити / відхилити / видано на грі —
// дзеркало бота) + налаштування (вкл/викл, ціна, множник, редагований текст-пояснення).
export default async function AdminPatches({
  searchParams,
}: {
  searchParams: { saved?: string; done?: string };
}) {
  await requirePerm("patch");
  const lang = getServerLang();
  const values = await getAllSettings();
  const isOn = (key: string) => values[key] === undefined || values[key] !== "false";

  // Активні заявки. patch_requests має два FK на players, тож тягнемо гравців окремо.
  const { data: reqs } = await supabase
    .from("patch_requests")
    .select("id, status, player_id, created_at")
    .in("status", ["requested", "approved"])
    .order("created_at", { ascending: true });
  const ids = [...new Set((reqs ?? []).map((r) => r.player_id as number))];
  const { data: pls } = ids.length
    ? await supabase.from("players").select("id, callsign, name, tg_username").in("id", ids)
    : { data: [] as { id: number; callsign: string | null; name: string | null; tg_username: string | null }[] };
  const pmap = new Map((pls ?? []).map((p) => [p.id, p]));

  return (
    <div className={ui.pageStack}>
      {(searchParams.saved || searchParams.done) && <p className={ui.alertOk}>{st(lang, "adm_saved")}</p>}

      {/* Заявки на патч */}
      <section className={ui.card}>
        <h2 className={`mb-3 ${ui.legend}`}>{st(lang, "adm_patch_requests_title")}</h2>
        {(reqs ?? []).length === 0 ? (
          <p className={ui.muted}>{st(lang, "adm_patch_no_requests")}</p>
        ) : (
          <div className={ui.listStack}>
            {(reqs ?? []).map((r) => {
              const p = pmap.get(r.player_id as number);
              const approved = r.status === "approved";
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-3 border border-gray-200 px-3 py-2">
                  <span className={ui.bodyStrong}>
                    {p?.callsign ?? p?.name ?? `#${r.player_id}`}
                    {p?.tg_username && <span className="ml-2 text-xs text-gray-400">@{p.tg_username}</span>}
                  </span>
                  <span className={badgeClass(approved ? "green" : "amber")}>
                    {st(lang, approved ? "adm_patch_st_approved" : "adm_patch_st_requested")}
                  </span>
                  {r.created_at && <span className={ui.metaFaint}>{formatGameWhen(r.created_at, lang)}</span>}
                  <div className="ml-auto flex items-center gap-2">
                    {approved ? (
                      <form action={handPatchRequest}>
                        <input type="hidden" name="reqId" value={r.id} />
                        <button type="submit" className={btn("action", "sm")}>
                          {st(lang, "adm_patch_hand")}
                        </button>
                      </form>
                    ) : (
                      <form action={approvePatchRequest}>
                        <input type="hidden" name="reqId" value={r.id} />
                        <button type="submit" className={btn("action", "sm")}>
                          {st(lang, "adm_patch_approve")}
                        </button>
                      </form>
                    )}
                    <form action={rejectPatchRequest}>
                      <input type="hidden" name="reqId" value={r.id} />
                      <button type="submit" className={btn("delete", "sm")}>
                        {st(lang, "adm_patch_reject")}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Налаштування системи патчів */}
      <form action={savePatchSettings} className="space-y-3">
        <h2 className={ui.legend}>{st(lang, "adm_patch_settings_title")}</h2>
        {PATCH_SETTINGS_GROUPS.map((g) => (
          <Collapsible
            key={g.title.en}
            summary={<span className={ui.cardTitle}>{g.title[lang]}</span>}
            right={<span className={ui.meta}>{g.fields.length}</span>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map((f) =>
                f.type === "toggle" ? (
                  <label
                    key={f.key}
                    className="flex items-center justify-between gap-3 border border-gray-200 px-3 py-2 text-sm"
                  >
                    <span className={ui.label}>
                      {f.label[lang]} <code className={ui.metaFaint}>{f.key}</code>
                    </span>
                    <input
                      type="checkbox"
                      name={f.key}
                      defaultChecked={isOn(f.key)}
                      className={`${ui.checkbox} shrink-0`}
                    />
                  </label>
                ) : (
                  <label key={f.key} className={`block text-sm ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                    <span className={`mb-1 ${ui.label}`}>
                      {f.label[lang]} <code className={ui.metaFaint}>{f.key}</code>
                    </span>
                    {f.type === "textarea" ? (
                      <textarea
                        name={f.key}
                        defaultValue={values[f.key] ?? ""}
                        placeholder={SETTING_DEFAULTS[f.key] ?? ""}
                        rows={8}
                        className={ui.input}
                      />
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        step="any"
                        name={f.key}
                        defaultValue={values[f.key] ?? ""}
                        placeholder={SETTING_DEFAULTS[f.key] ?? ""}
                        className={ui.input}
                      />
                    )}
                  </label>
                ),
              )}
            </div>
          </Collapsible>
        ))}
        <button type="submit" className={btn("action")}>
          {st(lang, "adm_save")}
        </button>
      </form>
    </div>
  );
}
