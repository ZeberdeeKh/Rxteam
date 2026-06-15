import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requireMaster } from "@/lib/admin";
import { getAllSettings } from "@/lib/settings";
import { SETTINGS_GROUPS, SETTING_DEFAULTS } from "@/lib/admin-settings";
import { saveSettings } from "@/app/admin/actions";

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
  const inputCls =
    "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
        {st(lang, "adm_settings_title")}
      </h1>
      {searchParams.saved && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, "adm_saved")}</p>
      )}
      <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
        {st(lang, "adm_settings_hint")}
      </p>

      <form action={saveSettings} className="space-y-8">
        {SETTINGS_GROUPS.map((g) => (
          <fieldset key={g.title} className="rounded-lg border border-neutral-200 bg-white p-5">
            <legend className="px-1 text-sm font-semibold text-brand-dark">{g.title}</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {g.fields.map((f) => (
                <label key={f.key} className="block text-sm">
                  <span className="mb-1 block text-neutral-600">
                    {f.label} <code className="text-xs text-neutral-400">{f.key}</code>
                  </span>
                  {f.type === "toggle" ? (
                    <input
                      type="checkbox"
                      name={f.key}
                      defaultChecked={isOn(f.key)}
                      className="h-4 w-4 accent-brand"
                    />
                  ) : f.type === "textarea" ? (
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
              ))}
            </div>
          </fieldset>
        ))}

        <button
          type="submit"
          className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          {st(lang, "adm_save")}
        </button>
      </form>
    </div>
  );
}
