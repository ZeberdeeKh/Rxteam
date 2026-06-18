import { notFound } from "next/navigation";
import { getSessionPlayer, type SitePlayer } from "./site-player";

// Гейт ролей адмінки (серверний). Майстер має всі права; інші — за admin_perms[].
// Один дозвіл = один пункт субменю адмінки. Виняток (тільки майстер, не делегується):
// «Налаштування» і «Ролі адмінів» — через них можна зламати конфіг / підвищити собі права.
export type AdminPerm =
  | "shop"
  | "achievements"
  | "games"
  | "locations"
  | "players"
  | "patch"
  | "referrals"
  | "rental"
  | "joins"
  | "gallery"
  | "marketplace"
  | "chores"
  | "faq"
  | "export";

// Порядок дзеркалить меню (adminNavLinks) — так виглядає список чекбоксів у «Ролях».
export const ALL_PERMS: AdminPerm[] = [
  "shop",
  "achievements",
  "games",
  "locations",
  "players",
  "patch",
  "referrals",
  "rental",
  "joins",
  "gallery",
  "marketplace",
  "chores",
  "faq",
  "export",
];

export function hasPerm(p: SitePlayer | null, perm: AdminPerm): boolean {
  if (!p) return false;
  if (p.is_master) return true;
  return Array.isArray(p.admin_perms) && p.admin_perms.includes(perm);
}

export function isAdmin(p: SitePlayer | null): boolean {
  if (!p) return false;
  return !!p.is_master || !!p.is_admin || (Array.isArray(p.admin_perms) && p.admin_perms.length > 0);
}

// Будь-який адмін (для шелла адмінки). null — якщо не адмін.
export async function getAdmin(): Promise<SitePlayer | null> {
  const p = await getSessionPlayer();
  return isAdmin(p) ? p : null;
}

// Гейт сторінки секції: вимагає конкретне право (майстер — усі). Не-адмін → 404.
export async function requirePerm(perm: AdminPerm): Promise<SitePlayer> {
  const p = await getSessionPlayer();
  if (!hasPerm(p, perm)) notFound();
  return p as SitePlayer;
}

// Гейт майстер-онлі секцій (налаштування, ролі).
export async function requireMaster(): Promise<SitePlayer> {
  const p = await getSessionPlayer();
  if (!p?.is_master) notFound();
  return p;
}
