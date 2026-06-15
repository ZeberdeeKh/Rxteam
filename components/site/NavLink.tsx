"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Навігаційне посилання з підсвічуванням активного маршруту.
// Активне, якщо поточний шлях збігається з href або є його під-шляхом
// (напр. /admin/games активний і на /admin/games/123). exact — лише точний збіг.
export default function NavLink({
  href,
  children,
  className,
  activeClassName,
  exact = false,
}: {
  href: string;
  children: ReactNode;
  className: string;
  activeClassName: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={active ? activeClassName : className}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
