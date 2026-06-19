import { supabase } from "@/lib/supabase";
import { bot } from "@/lib/bot";
import { expireOldListings, sweepStuckCollecting } from "@/lib/marketplace";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Відхиляє протерміновані заявки (хто не пройшов капчу вчасно).
export async function GET(req: Request) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

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

  // Барахолка (Етап 28): авто-протермінування approved + прибирання завислих collecting.
  const mpExpired = await expireOldListings();
  const mpSwept = await sweepStuckCollecting();

  return Response.json({ declined: expired?.length ?? 0, mp_expired: mpExpired, mp_swept: mpSwept });
}
