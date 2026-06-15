import { headers } from "next/headers";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { ui } from "@/components/ui";
import AuthForm from "@/components/auth/AuthForm";
import TelegramLoginButton from "@/components/auth/TelegramLoginButton";

// Числовий bot_id для OAuth Telegram = частина BOT_TOKEN до ":".
// (Сам токен лишається серверним секретом; назовні йде тільки публічний id.)
const TG_BOT_ID = process.env.BOT_TOKEN?.split(":")[0] ?? "";

function siteOrigin(): string {
  const h = headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${h.get("host") ?? "www.rxteam.pl"}`
  );
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const lang = getServerLang();

  return (
    <div className="mx-auto max-w-sm">
      {searchParams.error === "tg" && (
        <p className={`mb-4 ${ui.alertErr}`}>{st(lang, "auth_err_tg")}</p>
      )}

      <AuthForm mode="login" lang={lang} />

      {TG_BOT_ID && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs uppercase text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            {st(lang, "auth_or")}
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <p className={`mb-3 text-center ${ui.muted}`}>{st(lang, "auth_tg_hint")}</p>
          <TelegramLoginButton
            botId={TG_BOT_ID}
            origin={siteOrigin()}
            label={st(lang, "auth_tg_btn")}
          />
        </>
      )}
    </div>
  );
}
