import { supabase } from "./supabase";
import { awardPoints, getPointValue, grantCheckinAchievements } from "./economy";
import { confirmReferralCore } from "./referrals";

// Спільне ядро чек-іну (веб-самочек-ін кабінету + ручний чек-ін адміна).
// Бот має власну реалізацію (handleCheckin), але та сама доменна логіка нарахувань.
export async function performCheckin(opts: {
  player: {
    id: number;
    games_played?: number | null;
    has_patch?: boolean | null;
    callsign?: string | null;
    name?: string | null;
  };
  gameId: number;
  lat?: number | null;
  lng?: number | null;
  distanceM?: number | null;
  source: "web" | "manual" | "tg";
  isManual?: boolean;
  earlyMinutes?: number | null;
}): Promise<void> {
  const { player, gameId } = opts;

  await supabase.from("checkins").insert({
    game_id: gameId,
    player_id: player.id,
    lat: opts.lat ?? null,
    lng: opts.lng ?? null,
    distance_m: opts.distanceM ?? null,
    source: opts.source,
    is_manual: !!opts.isManual,
  });

  const gamesPlayedAfter = (player.games_played ?? 0) + 1;
  await supabase.from("players").update({ games_played: gamesPlayedAfter }).eq("id", player.id);

  await awardPoints({
    playerId: player.id,
    reason: "attend",
    baseDelta: await getPointValue("pts_attend", 10),
    gameId,
    hasPatch: !!player.has_patch,
  });

  await grantCheckinAchievements({
    playerId: player.id,
    gameId,
    gamesPlayedAfter,
    hasPatch: !!player.has_patch,
    earlyMinutes: opts.earlyMinutes ?? null,
  });

  // Якщо був позначений як неявка — повертаємо в registered.
  await supabase
    .from("registrations")
    .update({ status: "registered" })
    .eq("game_id", gameId)
    .eq("player_id", player.id)
    .eq("status", "no_show");

  await confirmReferralCore(
    { id: player.id, callsign: player.callsign ?? null, name: player.name ?? null },
    gameId,
    gamesPlayedAfter,
  );
}
