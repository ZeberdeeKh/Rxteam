import { notFound } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getAdmin, hasPerm } from "@/lib/admin";
import { ui, buttonClass } from "@/components/ui";

export const dynamic = "force-dynamic";

// Експорт CSV: окрема сторінка адмінки (винесено з дашборду).
export default async function AdminExportPage() {
  const admin = (await getAdmin())!; // layout уже відсік не-адмінів
  const lang = getServerLang();

  const canPlayers = hasPerm(admin, "players");
  const canGames = hasPerm(admin, "games");
  const canCheckin = hasPerm(admin, "checkin");
  if (!canPlayers && !canGames && !canCheckin) notFound();

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_nav_export")}</h1>
      <div className="flex flex-wrap gap-2">
        {canPlayers && (
          <a href="/admin/export/players" className={buttonClass("secondary", "sm")}>
            {st(lang, "adm_export_players")}
          </a>
        )}
        {canGames && (
          <a href="/admin/export/registrations" className={buttonClass("secondary", "sm")}>
            {st(lang, "adm_export_regs")}
          </a>
        )}
        {canCheckin && (
          <a href="/admin/export/checkins" className={buttonClass("secondary", "sm")}>
            {st(lang, "adm_export_checkins")}
          </a>
        )}
      </div>
    </div>
  );
}
