import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getSessionContext } from "@/lib/session-player";
import { isAdmin } from "@/lib/admin";
import { signOut } from "@/app/auth/actions";
import LangSwitcher from "@/components/LangSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import BugReport from "@/components/BugReport";
import { ui } from "@/components/ui";

export const metadata: Metadata = {
  title: "RX Team",
  description: "ASG / Airsoft community — Wrocław",
};

// Уникаємо «спалаху» світлої теми: ставимо .dark ДО першого рендера за збереженим вибором.
const themeInit = `(function(){try{var t=localStorage.getItem('rxteam-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

// Єдиний стиль навігаційного посилання у шапці.
const navLink = "rounded-md px-2.5 py-1.5 text-gray-600 transition hover:bg-brand/10 hover:text-brand";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getServerLang();
  const ctx = await getSessionContext();
  const loggedIn = ctx.state !== "anon";
  const admin = ctx.state === "linked" && isAdmin(ctx.player);

  // Лейбли bug-report резолвимо на сервері (є lang) і передаємо в клієнтський компонент.
  const bugLabels = {
    button: st(lang, "bug_button"),
    title: st(lang, "bug_title"),
    descriptionPlaceholder: st(lang, "bug_desc_ph"),
    emailOptional: st(lang, "bug_email"),
    attachScreenshot: st(lang, "bug_attach"),
    screenshotHint: st(lang, "bug_screenshot_hint"),
    removeScreenshot: st(lang, "bug_remove"),
    fileTooLarge: st(lang, "bug_too_large"),
    invalidImage: st(lang, "bug_invalid_image"),
    send: st(lang, "bug_send"),
    cancel: st(lang, "bug_cancel"),
    success: st(lang, "bug_success"),
    successHint: st(lang, "bug_success_hint"),
    close: st(lang, "bug_close"),
    error: st(lang, "bug_error"),
  };

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold uppercase tracking-wide text-brand-dark">RX&nbsp;Team</span>
              <span className="hidden text-xs text-gray-500 sm:inline">{st(lang, "brand_tagline")}</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/games" className={navLink}>
                {st(lang, "nav_games")}
              </Link>
              {loggedIn ? (
                <>
                  <Link href="/shop" className={navLink}>
                    {st(lang, "nav_shop")}
                  </Link>
                  <Link href="/cabinet" className={navLink}>
                    {st(lang, "nav_cabinet")}
                  </Link>
                  {admin && (
                    <Link href="/admin" className={`${navLink} font-medium text-brand`}>
                      {st(lang, "nav_admin")}
                    </Link>
                  )}
                  <form action={signOut}>
                    <button type="submit" className={navLink}>
                      {st(lang, "nav_logout")}
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className={navLink}>
                  {st(lang, "nav_login")}
                </Link>
              )}
              <span className="mx-1 h-5 w-px bg-gray-200" />
              <ThemeToggle title={st(lang, "theme_toggle")} />
              <LangSwitcher current={lang} />
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>

        <footer className="border-t border-gray-200 bg-white">
          <div className={`mx-auto w-full max-w-5xl px-4 py-4 ${ui.meta}`}>
            © RX Team · {st(lang, "footer_note")}
          </div>
        </footer>

        <BugReport labels={bugLabels} lang={lang} />
      </body>
    </html>
  );
}
