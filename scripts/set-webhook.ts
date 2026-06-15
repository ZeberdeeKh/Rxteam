// Реєстрація webhook у Telegram. Запуск ПІСЛЯ деплою:
//   BASE_URL=https://<app>.vercel.app BOT_TOKEN=... WEBHOOK_SECRET=... npm run set-webhook
//
// Важливо: chat_join_request НЕ входить у дефолтні апдейти — його треба явно вказати.
const token = process.env.BOT_TOKEN;
const base = process.env.BASE_URL;
const secret = process.env.WEBHOOK_SECRET;

if (!token || !base) {
  console.error("Потрібні BOT_TOKEN і BASE_URL у середовищі.");
  process.exit(1);
}

// Команди, видимі гравцям у меню бота (без адмін-команд).
const PLAYER_COMMANDS = [
  { command: "start",   description: "🚀 Start / Про бота" },
  { command: "profile", description: "👤 Мій профіль / My profile" },
  { command: "checkin", description: "✅ Чек-ін на гру / Check in" },
  { command: "top",     description: "🏆 Топ гравців / Top players" },
  { command: "patch",   description: "🪖 Нашивка / Membership patch" },
  { command: "rank",    description: "⭐ Моє звання / My rank" },
  { command: "ref",     description: "🔗 Реферальне посилання / Referral" },
  { command: "drivers", description: "🚗 Водії на гру / Drivers list" },
  { command: "myride",  description: "🛞 Моя поїздка (водій) / My ride" },
  { command: "rules",   description: "📋 Правила / FAQ" },
  { command: "lang",    description: "🌐 Змінити мову / Change language" },
  { command: "cancel",  description: "✖️ Скасувати дію / Cancel action" },
];

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

  const cmdRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ commands: PLAYER_COMMANDS }),
  });
  console.log("setMyCommands:", JSON.stringify(await cmdRes.json(), null, 2));
}

main();
