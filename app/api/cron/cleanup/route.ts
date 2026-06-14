import { supabase } from "@/lib/supabase";
import { bot } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Відхиляє протерміновані заявки (хто не пройшов капчу вчасно).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const { data: expired } = await supabase
    .from("join_challenges")
    .select("*")
    .eq("status", "pending")
    .lt("expires_at", nowIso);

  for (const ch of expired ?? []) {
    try {
      await bot.api.declineChatJoinRequest(ch.chat_id, ch.user_id);
    } catch {}
    await supabase.from("join_challenges").update({ status: "expired" }).eq("id", ch.id);
  }

  return Response.json({ declined: expired?.length ?? 0 });
}
