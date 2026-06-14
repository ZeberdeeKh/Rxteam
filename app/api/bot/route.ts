import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handle = webhookCallback(bot, "std/http", {
  secretToken: process.env.WEBHOOK_SECRET,
});

export async function POST(req: Request) {
  return handle(req);
}
