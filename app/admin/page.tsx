import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getAdmin, hasPerm } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Дашборд адмінки: плитки секцій (за правами) + експорт CSV.
export default async function AdminDashboard() {
  const admin = (await getAdmin())!; // layout уже відсік не-адмінів
  const lang = getServerLang();

  const tiles: { href: string; label: string; show: boolean }[] = [
    { href: "/admin/settings", label: st(lang, "adm_nav_settings"), show: !!admin.is_master },
    { href: "/admin/games", label: st(lang, "adm_nav_games"), show: hasPerm(admin, "games") },
    { href: "/admin/players", label: st(lang, "adm_nav_players"), show: hasPerm(admin, "players") },
    { href: "/admin/referrals", label: st(lang, "adm_nav_referrals"), show: hasPerm(admin, "referrals") },
    { href: "/admin/rental", label: st(lang, "adm_nav_rental"), show: hasPerm(admin, "rental") },
    { href: "/admin/joins", label: st(lang, "adm_nav_joins"), show: hasPerm(admin, "joins") },
    { href: "/admin/roles", label: st(lang, "adm_nav_roles"), show: !!admin.is_master },
  ].filter((t) => t.show);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "adm_title")}</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-lg border border-neutral-200 bg-white p-5 text-base font-medium text-neutral-800 transition hover:border-brand hover:text-brand"
          >
            {t.label} →
          </Link>
        ))}
      </div>

      {/* Експорт CSV */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {st(lang, "adm_export")}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {hasPerm(admin, "players") && (
            <a
              href="/admin/export/players"
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:border-brand hover:text-brand"
            >
              {st(lang, "adm_export_players")}
            </a>
          )}
          {hasPerm(admin, "games") && (
            <a
              href="/admin/export/registrations"
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:border-brand hover:text-brand"
            >
              {st(lang, "adm_export_regs")}
            </a>
          )}
          {hasPerm(admin, "checkin") && (
            <a
              href="/admin/export/checkins"
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:border-brand hover:text-brand"
            >
              {st(lang, "adm_export_checkins")}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
