"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LangSwitcher from "@/components/LangSwitcher";
import { signOut } from "@/app/auth/actions";
import type { Lang } from "@/lib/site-i18n";

// Мобільна навігація (< md): бургер у шапці → повноекранна чорна панель у стилі ab3.army.
// Панель перекриває всю в'юпорт-висоту, всередині скролиться (overscroll-contain), пункти —
// повноширинні рядки UPPERCASE display-шрифтом; активний — помаранчевий з лівим акцентом.
// Десктопне меню лишається в layout.tsx як `hidden md:flex`.

export interface MobileNavLabels {
  menu: string;
  close: string;
  home: string;
  marketplace: string;
  games: string;
  shop: string;
  cabinet: string;
  admin: string;
  login: string;
  logout: string;
}

type Item = { href: string; label: string; accent?: boolean };

export default function MobileNav({
  lang,
  loggedIn,
  admin,
  labels,
}: {
  lang: Lang;
  loggedIn: boolean;
  admin: boolean;
  labels: MobileNavLabels;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Закриваємо панель при зміні маршруту (перехід по посиланню).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Esc + блокування скролу body, поки панель відкрита.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const items: Item[] = [
    { href: "/", label: labels.home },
    { href: "/marketplace", label: labels.marketplace },
    { href: "/games", label: labels.games },
    ...(loggedIn
      ? [
          { href: "/shop", label: labels.shop },
          { href: "/cabinet", label: labels.cabinet },
          ...(admin ? [{ href: "/admin", label: labels.admin, accent: true }] : []),
        ]
      : [{ href: "/login", label: labels.login }]),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="md:hidden">
      {/* Бургер у шапці (44px тач-таргет) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.menu}
        aria-expanded={open}
        className="inline-flex h-11 w-11 items-center justify-center text-gray-700 transition-colors hover:text-[var(--c-brand-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--c-white)]">
          {/* Верхня смуга панелі — дзеркало шапки: вордмарк + хрестик */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <span className="font-display text-2xl font-extrabold uppercase leading-none tracking-wide text-[var(--c-brand-text)]">
              RX&nbsp;Team
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="inline-flex h-11 w-11 items-center justify-center text-gray-700 transition-colors hover:text-[var(--c-brand-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Пункти — повноширинні рядки; активний помаранчевий з лівим акцентом (HUD ab3) */}
          <nav className="flex-1 divide-y divide-gray-200 overflow-y-auto overscroll-contain [padding-bottom:env(safe-area-inset-bottom)]">
            {items.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center border-l-4 px-4 py-4 font-display text-lg font-semibold uppercase tracking-wide transition-colors ${
                    active
                      ? "border-[var(--c-primary)] text-[var(--c-brand-text)]"
                      : `border-transparent ${it.accent ? "text-[var(--c-brand-text)]" : "text-gray-700"} hover:text-[var(--c-brand-text)]`
                  }`}
                >
                  {it.label}
                </Link>
              );
            })}

            {loggedIn && (
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center border-l-4 border-transparent px-4 py-4 text-left font-display text-lg font-semibold uppercase tracking-wide text-gray-700 transition-colors hover:text-[var(--c-brand-text)]"
                >
                  {labels.logout}
                </button>
              </form>
            )}

            {/* Перемикач мови — внизу панелі */}
            <div className="px-4 py-4">
              <LangSwitcher current={lang} />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
