import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { ui, btn } from "@/components/ui";

export const dynamic = "force-dynamic";

// Експорт CSV: окремий пункт субменю → один дозвіл "export" дає доступ до всіх вивантажень.
export default async function AdminExportPage() {
  await requirePerm("export");
  const lang = getServerLang();

  return (
    <div className={ui.pageStack}>
      <div className="flex flex-wrap gap-2">
        <a href="/admin/export/players" className={btn("action")}>
          {st(lang, "adm_export_players")}
        </a>
        <a href="/admin/export/registrations" className={btn("action")}>
          {st(lang, "adm_export_regs")}
        </a>
        <a href="/admin/export/checkins" className={btn("action")}>
          {st(lang, "adm_export_checkins")}
        </a>
      </div>
    </div>
  );
}
