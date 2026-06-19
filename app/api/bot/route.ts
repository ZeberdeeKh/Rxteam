import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handle = webhookCallback(bot, "std/http", {
  secretToken: process.env.WEBHOOK_SECRET,
});

export async function POST(req: Request) {
  // FAIL-CLOSED: без WEBHOOK_SECRET не обробляємо апдейти взагалі (інакше будь-хто міг би
  // слати боту підроблені апдейти). grammy перевіряє X-Telegram-Bot-Api-Secret-Token лише
  // коли secretToken заданий — тож тут явно відмовляємо, якщо секрет відсутній.
  if (!process.env.WEBHOOK_SECRET) {
    return new Response("Webhook not configured", { status: 503 });
  }
  return handle(req);
}
