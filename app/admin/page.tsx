import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getAdmin, hasPerm } from "@/lib/admin";
import { ui, buttonClass } from "@/components/ui";

export const dynamic = "force-dynamic";

// Дашборд адмінки: плитки секцій (за правами) + експорт CSV.
export default async function AdminDashboard() {
  const admin = (await getAdmin())!; // layout уже відсік не-адмінів
  const lang = getServerLang();

  const tiles: { href: string; label: string; show: boolean }[] = [
    { href: "/admin/settings", label: st(lang, "adm_nav_settings"), show: !!admin.is_master },
    { href: "/admin/social", label: st(lang, "adm_nav_social"), show: !!admin.is_master },
    { href: "/admin/games", label: st(lang, "adm_nav_games"), show: hasPerm(admin, "games") },
    { href: "/admin/locations", label: st(lang, "adm_nav_locations"), show: hasPerm(admin, "games") },
    { href: "/admin/players", label: st(lang, "adm_nav_players"), show: hasPerm(admin, "players") },
    { href: "/admin/referrals", label: st(lang, "adm_nav_referrals"), show: hasPerm(admin, "referrals") },
    { href: "/admin/rental", label: st(lang, "adm_nav_rental"), show: hasPerm(admin, "rental") },
    { href: "/admin/joins", label: st(lang, "adm_nav_joins"), show: hasPerm(admin, "joins") },
    { href: "/admin/roles", label: st(lang, "adm_nav_roles"), show: !!admin.is_master },
  ].filter((t) => t.show);

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_title")}</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`${ui.cardHover} ${ui.cardTitle}`}
          >
            {t.label} →
          </Link>
        ))}
      </div>

      {/* Експорт CSV */}
      <section>
        <h2 className={`mb-2 ${ui.sectionTitle}`}>
          {st(lang, "adm_export")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {hasPerm(admin, "players") && (
            <a href="/admin/export/players" className={buttonClass("secondary", "sm")}>
              {st(lang, "adm_export_players")}
            </a>
          )}
          {hasPerm(admin, "games") && (
            <a href="/admin/export/registrations" className={buttonClass("secondary", "sm")}>
              {st(lang, "adm_export_regs")}
            </a>
          )}
          {hasPerm(admin, "checkin") && (
            <a href="/admin/export/checkins" className={buttonClass("secondary", "sm")}>
              {st(lang, "adm_export_checkins")}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
