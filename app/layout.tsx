import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getSessionContext } from "@/lib/session-player";
import { isAdmin } from "@/lib/admin";
import { signOut } from "@/app/auth/actions";
import LangSwitcher from "@/components/LangSwitcher";
import BugReport from "@/components/BugReport";
import NavLink from "@/components/site/NavLink";
import { ui, headerNavClass, headerAdminClass } from "@/components/ui";

// Опис слідує мові сайту (cookie rx_lang), тому генеруємо динамічно, а не статично.
export async function generateMetadata(): Promise<Metadata> {
  const lang = getServerLang();
  return {
    title: "RX Team",
    description: st(lang, "meta_description"),
  };
}

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
        {/* Mulish — тіло; Oswald — заголовки/кнопки (display). Стиль ab3.army. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-[66rem] items-center justify-between gap-4 px-4 py-7">
            {/* Текстовий вордмарк замість лого-картинки: рівно рендериться на будь-якій ширині.
                Колір — ЄДИНИЙ токен --c-brand-text (той самий, що й заголовки сайту). */}
            <Link href="/" className="flex items-baseline gap-2" aria-label="RX Team">
              <span className={ui.wordmark}>
                RX&nbsp;Team
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/" className={headerNavClass(false)} activeClassName={headerNavClass(true)}>
                {st(lang, "nav_home")}
              </NavLink>
              {loggedIn ? (
                <>
                  <NavLink href="/shop" className={headerNavClass(false)} activeClassName={headerNavClass(true)}>
                    {st(lang, "nav_shop")}
                  </NavLink>
                  <NavLink href="/cabinet" className={headerNavClass(false)} activeClassName={headerNavClass(true)}>
                    {st(lang, "nav_cabinet")}
                  </NavLink>
                  {admin && (
                    <NavLink href="/admin" className={headerAdminClass(false)} activeClassName={headerAdminClass(true)}>
                      {st(lang, "nav_admin")}
                    </NavLink>
                  )}
                  <form action={signOut}>
                    <button type="submit" className={headerNavClass(false)}>
                      {st(lang, "nav_logout")}
                    </button>
                  </form>
                </>
              ) : (
                <NavLink href="/login" className={headerNavClass(false)} activeClassName={headerNavClass(true)}>
                  {st(lang, "nav_login")}
                </NavLink>
              )}
              <span className="mx-1 h-5 w-px bg-gray-200" />
              <LangSwitcher current={lang} />
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[66rem] flex-1 px-4 py-8">{children}</main>

        <footer className="border-t border-gray-200 bg-white">
          <div className={`mx-auto w-full max-w-[66rem] px-4 py-4 text-center ${ui.meta}`}>
            RX Team · {st(lang, "footer_note")}
          </div>
        </footer>

        <BugReport labels={bugLabels} lang={lang} />
      </body>
    </html>
  );
}
