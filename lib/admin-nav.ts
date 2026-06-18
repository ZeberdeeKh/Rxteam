import { st, type Lang } from "@/lib/site-i18n";
import { hasPerm } from "@/lib/admin";
import type { SitePlayer } from "@/lib/site-player";

export type AdminNavLink = { href: string; label: string; show: boolean };

// Єдине джерело пунктів підменю адмінки — використовується і в шеллі (layout),
// і для редіректу /admin на перший доступний розділ. Порядок = порядок у меню.
export function adminNavLinks(admin: SitePlayer, lang: Lang): AdminNavLink[] {
  return [
    { href: "/admin/settings", label: st(lang, "adm_nav_settings"), show: !!admin.is_master },
    { href: "/admin/shop", label: st(lang, "adm_nav_shop"), show: hasPerm(admin, "shop") },
    { href: "/admin/achievements", label: st(lang, "adm_nav_achievements"), show: hasPerm(admin, "achievements") },
    { href: "/admin/games", label: st(lang, "adm_nav_games"), show: hasPerm(admin, "games") },
    { href: "/admin/locations", label: st(lang, "adm_nav_locations"), show: hasPerm(admin, "locations") },
    { href: "/admin/players", label: st(lang, "adm_nav_players"), show: hasPerm(admin, "players") },
    { href: "/admin/patches", label: st(lang, "adm_nav_patch"), show: hasPerm(admin, "patch") },
    { href: "/admin/referrals", label: st(lang, "adm_nav_referrals"), show: hasPerm(admin, "referrals") },
    { href: "/admin/rental", label: st(lang, "adm_nav_rental"), show: hasPerm(admin, "rental") },
    { href: "/admin/joins", label: st(lang, "adm_nav_joins"), show: hasPerm(admin, "joins") },
    { href: "/admin/gallery", label: st(lang, "adm_nav_gallery"), show: hasPerm(admin, "gallery") },
    { href: "/admin/marketplace", label: st(lang, "adm_nav_marketplace"), show: hasPerm(admin, "marketplace") },
    { href: "/admin/roles", label: st(lang, "adm_nav_roles"), show: !!admin.is_master },
    { href: "/admin/chores", label: st(lang, "adm_nav_chores"), show: hasPerm(admin, "chores") },
    {
      href: "/admin/export",
      label: st(lang, "adm_nav_export"),
      show: hasPerm(admin, "export"),
    },
  ];
}
