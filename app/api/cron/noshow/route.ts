import { supabase } from "@/lib/supabase";
import { awardPoints, getPointValue } from "@/lib/economy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Авто-позначка неявок: після закриття вікна чек-іну (checkin_to) реєстрації
// status='registered' без жодного чек-іну → no_show + штраф балами (Етап 3).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const nowIso = new Date().toISOString();

  // Ігри, у яких вікно чек-іну вже закрилося.
  const { data: games } = await supabase.from("games").select("id").lt("checkin_to", nowIso);
  const gameIds = (games ?? []).map((g) => g.id);
  if (!gameIds.length) return Response.json({ no_show: 0 });

  // Реєстрації цих ігор, які досі «registered».
  const { data: regs } = await supabase
    .from("registrations")
    .select("id, game_id, player_id")
    .eq("status", "registered")
    .in("game_id", gameIds);
  if (!regs?.length) return Response.json({ no_show: 0 });

  // Хто має чек-ін (ручний або гео).
  const { data: checks } = await supabase
    .from("checkins")
    .select("game_id, player_id")
    .in("game_id", gameIds);
  const checkedSet = new Set((checks ?? []).map((c) => `${c.game_id}:${c.player_id}`));

  const noShows = regs.filter((r) => !checkedSet.has(`${r.game_id}:${r.player_id}`));
  if (!noShows.length) return Response.json({ no_show: 0 });

  await supabase
    .from("registrations")
    .update({ status: "no_show" })
    .in(
      "id",
      noShows.map((r) => r.id),
    );

  // Штраф балами за неявку (−5 [заглушка], зі знаком у settings). Раз на реєстрацію.
  const penalty = await getPointValue("pts_noshow", -5);
  for (const r of noShows) {
    await awardPoints({ playerId: r.player_id, reason: "noshow", baseDelta: penalty, gameId: r.game_id });
  }

  return Response.json({ no_show: noShows.length });
}
