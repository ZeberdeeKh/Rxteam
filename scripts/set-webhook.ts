// Реєстрація webhook у Telegram. Запуск ПІСЛЯ деплою:
//   BASE_URL=https://<app>.vercel.app BOT_TOKEN=... WEBHOOK_SECRET=... npm run set-webhook
//
// Важливо: chat_join_request НЕ входить у дефолтні апдейти — його треба явно вказати.
import { playerCommands, MENU_LANGS } from "../lib/bot-commands";

const token = process.env.BOT_TOKEN;
const base = process.env.BASE_URL;
const secret = process.env.WEBHOOK_SECRET;

if (!token || !base) {
  console.error("Потрібні BOT_TOKEN і BASE_URL у середовищі.");
  process.exit(1);
}

async function setCommands(body: Record<string, unknown>, label: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(`setMyCommands (${label}):`, JSON.stringify(await res.json(), null, 2));
}

async function main() {
  const url = `${base}/api/bot`;

  const whRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret || undefined,
      allowed_updates: ["chat_join_request", "chat_member", "callback_query", "message"],
      drop_pending_updates: true,
    }),
  });
  console.log("setWebhook:", JSON.stringify(await whRes.json(), null, 2));

  // Базові набори меню за language_code клієнта Telegram (для першого контакту, поки гравець
  // не обрав мову через /lang — тоді бот ставить точне меню per-chat, lib/bot.ts).
  // Ставимо для default і all_private_chats (Telegram пріоритизує конкретніший скоуп).
  for (const scope of [{ type: "default" }, { type: "all_private_chats" }]) {
    for (const lang of MENU_LANGS) {
      await setCommands(
        { commands: playerCommands(lang), scope, language_code: lang },
        `${scope.type}/${lang}`,
      );
    }
    // Дефолт без language_code (фолбек для всіх інших мов клієнта) — англійською.
    await setCommands({ commands: playerCommands("en"), scope }, `${scope.type}/default`);
  }
}

main();
