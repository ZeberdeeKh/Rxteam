import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getAdmin, hasPerm } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Шелл адмінки: гейт «будь-який адмін», далі секції — за правами (гейт ще раз на кожній сторінці).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) notFound();
  const lang = getServerLang();

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/admin", label: st(lang, "adm_title"), show: true },
    { href: "/admin/settings", label: st(lang, "adm_nav_settings"), show: !!admin.is_master },
    { href: "/admin/games", label: st(lang, "adm_nav_games"), show: hasPerm(admin, "games") },
    { href: "/admin/locations", label: st(lang, "adm_nav_locations"), show: hasPerm(admin, "games") },
    { href: "/admin/players", label: st(lang, "adm_nav_players"), show: hasPerm(admin, "players") },
    { href: "/admin/referrals", label: st(lang, "adm_nav_referrals"), show: hasPerm(admin, "referrals") },
    { href: "/admin/rental", label: st(lang, "adm_nav_rental"), show: hasPerm(admin, "rental") },
    { href: "/admin/joins", label: st(lang, "adm_nav_joins"), show: hasPerm(admin, "joins") },
    { href: "/admin/roles", label: st(lang, "adm_nav_roles"), show: !!admin.is_master },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3 text-sm">
        {links
          .filter((l) => l.show)
          .map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1 text-neutral-700 hover:bg-brand/10 hover:text-brand"
            >
              {l.label}
            </Link>
          ))}
      </nav>
      {children}
    </div>
  );
}
