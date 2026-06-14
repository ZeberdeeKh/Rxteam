"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase-server";
import { featureEnabled } from "@/lib/settings";
import { redeemLinkCode } from "@/lib/identities";
import { supabase } from "@/lib/supabase";
import {
  getSessionPlayer,
  createStandalonePlayerForSession,
  setCallsignForPlayer,
} from "@/lib/site-player";
import { registeredCount, distanceMeters } from "@/lib/games";
import { performCheckin } from "@/lib/checkins";

export type LinkState = { error?: string };

const REASON_KEY: Record<string, string> = {
  not_found: "link_err_not_found",
  expired: "link_err_expired",
  used: "link_err_used",
  taken: "link_err_taken",
};

// Прив'язка email-сесії до TG-профілю за одноразовим кодом із бота (/linksite).
export async function linkTelegram(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  if (!(await featureEnabled("site_link"))) return { error: "auth_err_generic" };

  const code = String(formData.get("code") ?? "");
  const res = await redeemLinkCode(code, user.id);
  if (!res.ok) return { error: REASON_KEY[res.reason] ?? "auth_err_generic" };

  redirect("/cabinet?linked=1");
}

// ─────────────────────────────── 6.2 Кабінет ───────────────────────────────
// Усі дії — серверні, з перевіркою сесії. Бізнес-правила = ті самі, що в боті.
const back = (q: string) => redirect(`/cabinet${q}`);

// Створити standalone-профіль (email-юзер без TG). Рішення організатора 2026-06-15.
export async function createStandalone() {
  const res = await createStandalonePlayerForSession();
  if (!res.ok) back(res.reason === "anon" ? "" : "?err=generic");
  revalidatePath("/cabinet");
  back("?welcome=1");
}

// Призначити позивний (унікальний). Потрібен перед першим записом на гру.
export async function saveCallsign(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");
  const res = await setCallsignForPlayer(player.id, String(formData.get("callsign") ?? ""));
  if (!res.ok) back(`?err=callsign_${res.reason}`);
  revalidatePath("/cabinet");
  back("?callsign=1");
}

// Запис на гру (рег відкрита до reg_closes_at = збір −9год).
export async function registerForGame(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");
  if (!player.callsign) back("?err=need_callsign");

  const gameId = Number(formData.get("gameId"));
  if (!Number.isFinite(gameId)) back("?err=generic");

  const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!game || game.status !== "announced") back("?err=game_not_found");
  if (game!.reg_closes_at && new Date(game!.reg_closes_at).getTime() < Date.now()) back("?err=reg_closed");
  if (game!.capacity && (await registeredCount(gameId)) >= game!.capacity) back("?err=game_full");

  const transport = formData.get("transport") === "own" ? "own" : "need";
  const needsRental = formData.get("needs_rental") === "on";
  const fromPlace = transport === "own" ? String(formData.get("from_place") ?? "").trim() || null : null;
  const freeSeatsRaw = Number(formData.get("free_seats"));
  const freeSeats = transport === "own" && Number.isFinite(freeSeatsRaw) ? freeSeatsRaw : null;

  await supabase.from("registrations").upsert(
    {
      game_id: gameId,
      player_id: player.id,
      status: "registered",
      needs_rental: needsRental,
      transport,
      from_place: fromPlace,
      free_seats: freeSeats,
      seats_closed: false,
    },
    { onConflict: "game_id,player_id" },
  );
  revalidatePath("/cabinet");
  back("?reg=1");
}

// Відписка (без штрафу до cancel_deadline = збір −24год; після — зобов'язання, блок).
export async function unregisterFromGame(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");

  const gameId = Number(formData.get("gameId"));
  if (!Number.isFinite(gameId)) back("?err=generic");

  const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!game) back("?err=game_not_found");
  if (game!.cancel_deadline && new Date(game!.cancel_deadline).getTime() < Date.now()) back("?err=cancel_locked");

  await supabase
    .from("registrations")
    .update({ status: "cancelled" })
    .eq("game_id", gameId)
    .eq("player_id", player.id);
  revalidatePath("/cabinet");
  back("?unreg=1");
}

// Самочек-ін для не-TG (браузерна геолокація). Той самий haversine + вікно, що в боті.
export async function webCheckin(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");

  const gameId = Number(formData.get("gameId"));
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!Number.isFinite(gameId) || !Number.isFinite(lat) || !Number.isFinite(lng)) back("?err=geo");

  const { data: game } = await supabase
    .from("games")
    .select("*, locations(*)")
    .eq("id", gameId)
    .single();
  const now = Date.now();
  if (
    !game ||
    !game.checkin_from ||
    !game.checkin_to ||
    now < new Date(game.checkin_from).getTime() ||
    now > new Date(game.checkin_to).getTime()
  ) {
    back("?err=checkin_window");
  }

  // Має бути реєстрація (registered/no_show) — не пускаємо чек-ін без запису.
  const { data: reg } = await supabase
    .from("registrations")
    .select("status")
    .eq("game_id", gameId)
    .eq("player_id", player.id)
    .maybeSingle();
  if (!reg || (reg.status !== "registered" && reg.status !== "no_show")) back("?err=not_registered");

  const gl = (game as any).locations;
  const dist = Math.round(distanceMeters(lat, lng, gl.lat, gl.lng));
  if (dist > gl.radius_m) back("?err=too_far");

  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("game_id", gameId)
    .eq("player_id", player.id)
    .maybeSingle();
  if (existing) back("?err=checkin_already");

  const earlyMin = Math.floor((now - new Date(game!.checkin_from).getTime()) / 60000);
  await performCheckin({
    player: {
      id: player.id,
      games_played: player.games_played,
      has_patch: player.has_patch,
      callsign: player.callsign,
      name: player.name,
    },
    gameId,
    lat,
    lng,
    distanceM: dist,
    source: "web",
    earlyMinutes: earlyMin,
  });

  revalidatePath("/cabinet");
  back("?checkin=1");
}
