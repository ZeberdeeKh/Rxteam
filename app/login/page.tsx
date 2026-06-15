import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { ui } from "@/components/ui";
import AuthForm from "@/components/auth/AuthForm";
import TelegramLoginButton from "@/components/auth/TelegramLoginButton";

// Числовий bot_id для Telegram.Login.auth = частина BOT_TOKEN до ":".
// (Токен лишається серверним секретом; назовні йде лише публічний id.)
const TG_BOT_ID = process.env.BOT_TOKEN?.split(":")[0] ?? "";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const lang = getServerLang();

  return (
    <div className="mx-auto max-w-sm">
      {(() => {
        // tg → невдалий вхід через Telegram; confirm → невдале підтвердження e-mail
        // (редірект з app/auth/confirm/route.ts). Обидва ключі вже перекладені pl/en/uk.
        const errKey =
          searchParams.error === "tg"
            ? "auth_err_tg"
            : searchParams.error === "confirm"
            ? "auth_confirm_failed"
            : null;
        return errKey ? <p className={`mb-4 ${ui.alertErr}`}>{st(lang, errKey)}</p> : null;
      })()}

      <AuthForm mode="login" lang={lang} />

      {TG_BOT_ID && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs uppercase text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            {st(lang, "auth_or")}
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <p className={`mb-3 text-center ${ui.muted}`}>{st(lang, "auth_tg_hint")}</p>
          <TelegramLoginButton botId={TG_BOT_ID} label={st(lang, "auth_tg_btn")} />
        </>
      )}
    </div>
  );
}
