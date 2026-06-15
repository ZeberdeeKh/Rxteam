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

async function main() {
  const url = `${base}/api/bot`;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret || undefined,
      allowed_updates: ["chat_join_request", "chat_member", "callback_query", "message"],
      drop_pending_updates: true,
    }),
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}

main();
