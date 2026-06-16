import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requireMaster } from "@/lib/admin";
import { getAllSettings } from "@/lib/settings";
import { SETTINGS_GROUPS, SETTING_DEFAULTS } from "@/lib/admin-settings";
import { saveSettings } from "@/app/admin/actions";
import { ui, btn, Collapsible } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettings({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  await requireMaster();
  const lang = getServerLang();
  const values = await getAllSettings();

  // toggle вважається увімкненим, якщо значення не 'false' (за замовчуванням — on).
  const isOn = (key: string) => values[key] === undefined || values[key] !== "false";
  const inputCls = ui.input;

  return (
    <div className={ui.pageStack}>
      {searchParams.saved && (
        <p className={ui.alertOk}>{st(lang, "adm_saved")}</p>
      )}
      <p className={ui.panel}>
        {st(lang, "adm_settings_hint")}
      </p>

      <form action={saveSettings} className="space-y-3">
        {SETTINGS_GROUPS.map((g) => (
          <Collapsible
            key={g.title.en}
            summary={<span className={ui.cardTitle}>{g.title[lang]}</span>}
            right={<span className={ui.meta}>{g.fields.length}</span>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map((f) =>
                f.type === "toggle" ? (
                  // Тоглі — рядок «лейбл + перемикач» праворуч (рівні картки однакової висоти).
                  <label
                    key={f.key}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm"
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
                  <label key={f.key} className="block text-sm">
                    <span className={`mb-1 ${ui.label}`}>
                      {f.label[lang]} <code className={ui.metaFaint}>{f.key}</code>
                    </span>
                    {f.type === "textarea" ? (
                      <textarea
                        name={f.key}
                        defaultValue={values[f.key] ?? ""}
                        placeholder={SETTING_DEFAULTS[f.key] ?? ""}
                        rows={3}
                        className={inputCls}
                      />
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        step="any"
                        name={f.key}
                        defaultValue={values[f.key] ?? ""}
                        placeholder={SETTING_DEFAULTS[f.key] ?? ""}
                        className={inputCls}
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
