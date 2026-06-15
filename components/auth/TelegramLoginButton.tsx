import { buttonClass } from "@/components/ui";

// Власна кнопка входу через Telegram у стилі форми (variant "primary").
// Замість офіційного iframe-віджета — звичайне посилання на OAuth-редірект
// Telegram (той самий redirect-потік): Telegram повертає підписані дані на
// /auth/telegram, де перевіряється підпис. Домен бота має бути заданий у
// @BotFather (/setdomain → www.rxteam.pl), інакше Telegram не авторизує.
export default function TelegramLoginButton({
  botId,
  origin,
  label,
}: {
  botId: string;
  origin: string;
  label: string;
}) {
  const authUrl =
    "https://oauth.telegram.org/auth?" +
    new URLSearchParams({
      bot_id: botId,
      origin,
      request_access: "write",
      return_to: `${origin}/auth/telegram`,
    }).toString();

  return (
    <a href={authUrl} className={`${buttonClass("primary")} w-full`}>
      <TelegramIcon />
      {label}
    </a>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}
