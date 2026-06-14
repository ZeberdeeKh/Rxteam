import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getSessionContext } from "@/lib/session-player";
import { signOut } from "@/app/auth/actions";
import LangSwitcher from "@/components/LangSwitcher";

export const metadata: Metadata = {
  title: "RX Team",
  description: "ASG / Airsoft community — Wrocław",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getServerLang();
  const loggedIn = (await getSessionContext()).state !== "anon";

  return (
    <html lang={lang}>
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-brand-dark">RX&nbsp;Team</span>
              <span className="hidden text-xs text-neutral-500 sm:inline">{st(lang, "brand_tagline")}</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/games" className="text-neutral-700 hover:text-brand">
                {st(lang, "nav_games")}
              </Link>
              <Link href="/ranking" className="text-neutral-700 hover:text-brand">
                {st(lang, "nav_ranking")}
              </Link>
              {loggedIn ? (
                <>
                  <Link href="/shop" className="text-neutral-700 hover:text-brand">
                    {st(lang, "nav_shop")}
                  </Link>
                  <Link href="/cabinet" className="text-neutral-700 hover:text-brand">
                    {st(lang, "nav_cabinet")}
                  </Link>
                  <form action={signOut}>
                    <button type="submit" className="text-neutral-700 hover:text-brand">
                      {st(lang, "nav_logout")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-neutral-700 hover:text-brand">
                    {st(lang, "nav_login")}
                  </Link>
                  <Link href="/register" className="text-neutral-700 hover:text-brand">
                    {st(lang, "nav_register")}
                  </Link>
                </>
              )}
              <LangSwitcher current={lang} />
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>

        <footer className="border-t border-neutral-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-neutral-500">
            © RX Team · {st(lang, "footer_note")}
          </div>
        </footer>
      </body>
    </html>
  );
}
