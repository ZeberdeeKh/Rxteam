import { supabase } from "./supabase";
import { featureEnabled } from "./settings";
import { awardPoints, grantAchievement, getPointValue, type GrantedAch } from "./economy";

// Доменне ядро рефералів — спільне для бота й сайту (без Telegram-нотифікацій).
// Telegram-повідомлення інвайтеру лишається у lib/bot.ts (обгортка над цим ядром).

export type ReferralConfirm = {
  inviter: {
    id: number;
    callsign: string | null;
    name: string | null;
    lang: string | null;
    tg_user_id: number | null;
    has_patch: boolean;
  };
  invitedWho: string;
  pts: number;
  ach: GrantedAch | null;
  confirmedCount: number; // підтверджених рефералів інвайтера на цю гру
  gameTitle: string | null;
};

// Авто-зарахування реферала на ПЕРШОМУ чек-іні новачка: +бали інвайтеру, ачівка Recruiter, знижка.
// Повертає дані для нотифікації або null (не перша гра / вимкнено / немає pending-реферала).
export async function confirmReferralCore(
  invited: { id: number; callsign?: string | null; name?: string | null },
  gameId: number,
  gamesPlayedAfter: number,
): Promise<ReferralConfirm | null> {
  if (gamesPlayedAfter !== 1) return null; // лише перша гра новачка
  if (!(await featureEnabled("referrals"))) return null;

  const { data: ref } = await supabase
    .from("referrals")
    .select("id, inviter_id")
    .eq("invited_id", invited.id)
    .eq("status", "pending")
    .maybeSingle();
  if (!ref) return null;

  await supabase
    .from("referrals")
    .update({ status: "confirmed", game_id: gameId, confirmed_at: new Date().toISOString() })
    .eq("id", ref.id);

  const { data: inviter } = await supabase
    .from("players")
    .select("id, callsign, name, lang, tg_user_id, has_patch")
    .eq("id", ref.inviter_id)
    .single();
  if (!inviter) return null;

  const pts = await awardPoints({
    playerId: inviter.id,
    reason: "friend",
    baseDelta: await getPointValue("pts_friend", 10),
    gameId,
    meta: `invited:${invited.id}`,
    hasPatch: !!inviter.has_patch,
  });
  const ach = await grantAchievement(inviter.id, "recruiter", gameId, !!inviter.has_patch);

  const { count } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("inviter_id", inviter.id)
    .eq("game_id", gameId)
    .eq("status", "confirmed");

  const { data: game } = await supabase.from("games").select("title").eq("id", gameId).single();

  return {
    inviter: {
      id: inviter.id,
      callsign: inviter.callsign ?? null,
      name: inviter.name ?? null,
      lang: inviter.lang ?? null,
      tg_user_id: inviter.tg_user_id ?? null,
      has_patch: !!inviter.has_patch,
    },
    invitedWho: invited.callsign ?? invited.name ?? "?",
    pts,
    ach,
    confirmedCount: count ?? 0,
    gameTitle: game?.title ?? null,
  };
}
