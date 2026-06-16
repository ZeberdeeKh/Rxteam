import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requireMaster } from "@/lib/admin";
import { getAllSettings } from "@/lib/settings";
import { SOCIALS } from "@/lib/social";
import { saveSocial } from "@/app/admin/actions";
import { ui, btn } from "@/components/ui";

export const dynamic = "force-dynamic";

// Соцмережі: лінки для лендінгу. Лише майстер (як і налаштування).
export default async function AdminSocial({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  await requireMaster();
  const lang = getServerLang();
  const values = await getAllSettings();

  return (
    <div className={ui.pageStack}>
      {searchParams.saved && <p className={ui.alertOk}>{st(lang, "adm_saved")}</p>}
      <p className={ui.panel}>{st(lang, "adm_social_hint")}</p>

      <form action={saveSocial} className="space-y-8">
        <fieldset className={ui.card}>
          <h2 className={ui.sectionTitle}>{st(lang, "adm_social_title")}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {SOCIALS.map((s) => (
              <label key={s.settingKey} className="block text-sm">
                <span className={`mb-1 ${ui.label}`}>
                  {s.label} <code className={ui.metaFaint}>{s.settingKey}</code>
                </span>
                <input
                  type="url"
                  name={s.settingKey}
                  defaultValue={values[s.settingKey] ?? ""}
                  placeholder={s.defaultUrl || "https://…"}
                  className={ui.input}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className={btn("action")}>
          {st(lang, "adm_save")}
        </button>
      </form>
    </div>
  );
}
