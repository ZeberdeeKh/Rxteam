"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase-server";
import { featureEnabled } from "@/lib/settings";
import { redeemLinkCode } from "@/lib/identities";
import { rateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";
import { getSessionContext } from "@/lib/session-player";
import { notifyAdminsRental, notifyAdminsPatchRequest } from "@/lib/notify";
import {
  getSessionPlayer,
  createStandalonePlayerForSession,
  setCallsignForPlayer,
} from "@/lib/site-player";
import { registeredCount, distanceMeters } from "@/lib/games";
import { performCheckin } from "@/lib/checkins";
import { cancelDriverRideRequests, announceDriverToSeekers } from "@/lib/carpool";

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

  // Анти-брутфорс коду прив'язки: ≤8 спроб / 10 хв на auth-user (best-effort, per-instance).
  if (!rateLimit(`link:${user.id}`, 8, 10 * 60_000)) return { error: "auth_err_rate_limit" };

  const code = String(formData.get("code") ?? "");
  const res = await redeemLinkCode(code, user.id);
  if (!res.ok) return { error: REASON_KEY[res.reason] ?? "auth_err_generic" };

  redirect("/cabinet?linked=1");
}

// ─────────────────────────────── 6.2 Кабінет ───────────────────────────────
// Усі дії — серверні, з перевіркою сесії. Бізнес-правила = ті самі, що в боті.
const back = (q: string) => redirect(`/cabinet${q}`);

// Куди повертати після дії: /cabinet (дефолт) або /games — за полем returnTo форми.
// Дозволяємо лише власні шляхи (захист від open-redirect).
const RETURN_PATHS = new Set(["/cabinet", "/games", "/my-games"]);
function backTo(formData: FormData, q: string): never {
  const rt = String(formData.get("returnTo") ?? "");
  const base = RETURN_PATHS.has(rt) ? rt : "/cabinet";
  return redirect(`${base}${q}`);
}

// Створити standalone-профіль (email-юзер без TG). Рішення організатора 2026-06-15.
export async function createStandalone() {
  const res = await createStandalonePlayerForSession();
  if (!res.ok) back(res.reason === "anon" ? "" : "?err=generic");
  revalidatePath("/cabinet");
  back("?welcome=1");
}

// Призначити позивний (унікальний). Ставиться ОДИН раз — перед першим записом на гру.
// Якщо позивний уже є, зміна заборонена тут (лише через магазин за бали / ранг Squad Leader,
// див. changeCallsign у app/shop/actions.ts) — захист від обходу «set once» крафтнутим POST.
export async function saveCallsign(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");
  if (player.callsign) back("?err=callsign_locked");
  const res = await setCallsignForPlayer(player.id, String(formData.get("callsign") ?? ""));
  if (!res.ok) back(`?err=callsign_${res.reason}`);
  revalidatePath("/cabinet");
  back("?callsign=1");
}

// Запит на патч із кабінету. Дзеркалить /patch у боті: та сама вставка/статус, дедуп, сповіщення.
export async function requestPatch() {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");
  if (!(await featureEnabled("patch"))) back("?err=patch_off");
  if (player.has_patch) back("?err=patch_has");

  // Дедуп: відкритий запит (requested|approved) блокує новий — як у боті.
  const { data: open } = await supabase
    .from("patch_requests")
    .select("status")
    .eq("player_id", player.id)
    .in("status", ["requested", "approved"])
    .limit(1)
    .maybeSingle();
  if (open) back("?err=patch_pending");

  // Партійний UNIQUE-індекс (etap24) ловить гонку подвійного сабміту: 23505 = вже є відкритий запит.
  const { data: row, error } = await supabase
    .from("patch_requests")
    .insert({ player_id: player.id, status: "requested" })
    .select("id")
    .single();
  if (error) back(error.code === "23505" ? "?err=patch_pending" : "?err=generic");

  // Best-effort: ті самі отримувачі (getAdminsWithPerm("patch")) і текст, що в боті,
  // + посилання на чат із гравцем і кнопки підтвердження/відхилення.
  await notifyAdminsPatchRequest({
    id: row!.id,
    who: player.callsign ?? player.name ?? "?",
    tgUserId: player.tg_user_id,
    tgUsername: player.tg_username,
  });

  revalidatePath("/cabinet");
  back("?patch_requested=1");
}

// Запис на гру (рег відкрита до reg_closes_at = збір −9год).
export async function registerForGame(formData: FormData) {
  const ctx = await getSessionContext();
  const player = ctx.state === "linked" ? ctx.player : null;
  if (!player) redirect("/login");
  if (!player.callsign) backTo(formData, "?err=need_callsign");

  const gameId = Number(formData.get("gameId"));
  if (!Number.isFinite(gameId)) backTo(formData, "?err=generic");

  const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!game || game.status !== "announced") backTo(formData, "?err=game_not_found");
  if (game!.reg_closes_at && new Date(game!.reg_closes_at).getTime() < Date.now()) backTo(formData, "?err=reg_closed");
  if (game!.capacity && (await registeredCount(gameId)) >= game!.capacity) backTo(formData, "?err=game_full");

  const tRaw = formData.get("transport");
  const transport = tRaw === "own" ? "own" : tRaw === "skip" ? null : "need";
  const needsRental = formData.get("needs_rental") === "on";
  const freeSeatsRaw = Number(formData.get("free_seats"));
  // Зажимаємо в 0..8 цілих (форма має min=0/max=8, але server action отримує сирий POST).
  const freeSeats =
    transport === "own" && Number.isFinite(freeSeatsRaw)
      ? Math.max(0, Math.min(8, Math.trunc(freeSeatsRaw)))
      : null;

  // Ціна за місце (zł) — обов'язкова для водія (Етап 35), 0..1000.
  const priceRaw = Number(formData.get("ride_price"));
  const ridePrice =
    transport === "own" && Number.isFinite(priceRaw)
      ? Math.max(0, Math.min(1000, Math.trunc(priceRaw)))
      : null;
  if (transport === "own" && ridePrice === null) backTo(formData, "?err=need_price");

  // Точка виїзду водія з вбудованої мапи форми (порожньо → пін можна поставити пізніше на /carpool).
  const latStr = String(formData.get("from_lat") ?? "");
  const lngStr = String(formData.get("from_lng") ?? "");
  const latNum = latStr === "" ? NaN : Number(latStr);
  const lngNum = lngStr === "" ? NaN : Number(lngStr);
  const fromLat =
    transport === "own" && Number.isFinite(latNum) && latNum >= -90 && latNum <= 90 ? latNum : null;
  const fromLng =
    transport === "own" && Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180 ? lngNum : null;

  // Чи був пін раніше — щоб анонсувати водія шукачам лише на «перший пін» (без спаму).
  const { data: existingReg } = await supabase
    .from("registrations")
    .select("from_lat")
    .eq("game_id", gameId)
    .eq("player_id", player.id)
    .maybeSingle();
  const hadPin = existingReg?.from_lat != null;

  const regRow: Record<string, any> = {
    game_id: gameId,
    player_id: player.id,
    status: "registered",
    needs_rental: needsRental,
    transport,
    free_seats: freeSeats,
    ride_price: ridePrice,
    seats_closed: false,
  };
  // Пін зберігаємо лише якщо щойно поставлений — інакше не чіпаємо наявний (повторна реєстрація).
  if (fromLat !== null && fromLng !== null) {
    regRow.from_lat = fromLat;
    regRow.from_lng = fromLng;
  }
  await supabase.from("registrations").upsert(regRow, { onConflict: "game_id,player_id" });

  // Пом'якшення гонки місткості (повний атомарний фікс потребує DB-функції): після запису
  // перевіряємо ще раз — якщо перевищили місткість, відкочуємо саме цю реєстрацію.
  if (game!.capacity && (await registeredCount(gameId)) > game!.capacity) {
    await supabase
      .from("registrations")
      .update({ status: "cancelled" })
      .eq("game_id", gameId)
      .eq("player_id", player.id);
    backTo(formData, "?err=game_full");
  }

  // Оренда: повідомити адмінів у ТГ із контактом орендаря (TG-лінк або email сайт-юзера).
  if (needsRental) {
    await notifyAdminsRental({
      callsign: player.callsign,
      name: player.name,
      tgUserId: player.tg_user_id,
      tgUsername: player.tg_username,
      email: ctx.state === "linked" ? ctx.email : null,
      game,
    });
  }

  // Перший пін водія при реєстрації → анонімно сповіщаємо шукачів авто на цю гру.
  if (transport === "own" && fromLat !== null && !hadPin) {
    await announceDriverToSeekers(gameId, player.id);
  }

  revalidatePath("/cabinet");
  revalidatePath("/games");
  revalidatePath("/my-games");
  // Карпул: водій уже з піном (точки/маршрут — на /carpool), пасажир бачить водіїв. Обом — на /carpool.
  if (transport === "own" || transport === "need") {
    redirect(`/carpool?game=${gameId}&ok=reg`);
  }
  backTo(formData, "?reg=1");
}

// Відписка (без штрафу до cancel_deadline = збір −24год; після — зобов'язання, блок).
export async function unregisterFromGame(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");

  const gameId = Number(formData.get("gameId"));
  if (!Number.isFinite(gameId)) backTo(formData, "?err=generic");

  const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!game) backTo(formData, "?err=game_not_found");
  if (game!.cancel_deadline && new Date(game!.cancel_deadline).getTime() < Date.now()) backTo(formData, "?err=cancel_locked");

  await supabase
    .from("registrations")
    .update({ status: "cancelled" })
    .eq("game_id", gameId)
    .eq("player_id", player.id);
  // Карпул (Етап 34): якщо знявся водій — скасовуємо його брони й сповіщаємо пасажирів.
  await cancelDriverRideRequests(gameId, player.id);
  revalidatePath("/cabinet");
  revalidatePath("/games");
  revalidatePath("/my-games");
  backTo(formData, "?unreg=1");
}

// Самочек-ін для не-TG (браузерна геолокація). Той самий haversine + вікно, що в боті.
export async function webCheckin(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");

  const gameId = Number(formData.get("gameId"));
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!Number.isFinite(gameId) || !Number.isFinite(lat) || !Number.isFinite(lng)) backTo(formData, "?err=geo");

  const { data: game } = await supabase
    .from("games")
    .select("*, locations(*)")
    .eq("id", gameId)
    .single();
  // Чек-ін лише в анонсовану гру (не покладаємось лише на статус реєстрації: скасована
  // гра з реєстрацією у no_show інакше пройшла б).
  if (!game || game.status !== "announced") backTo(formData, "?err=game_not_found");
  const now = Date.now();
  if (
    !game ||
    !game.checkin_from ||
    !game.checkin_to ||
    now < new Date(game.checkin_from).getTime() ||
    now > new Date(game.checkin_to).getTime()
  ) {
    backTo(formData, "?err=checkin_window");
  }

  // Має бути реєстрація (registered/no_show) — не пускаємо чек-ін без запису.
  const { data: reg } = await supabase
    .from("registrations")
    .select("status")
    .eq("game_id", gameId)
    .eq("player_id", player.id)
    .maybeSingle();
  if (!reg || (reg.status !== "registered" && reg.status !== "no_show")) backTo(formData, "?err=not_registered");

  const gl = (game as any).locations;
  const dist = Math.round(distanceMeters(lat, lng, gl.lat, gl.lng));
  if (dist > gl.radius_m) backTo(formData, "?err=too_far");

  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("game_id", gameId)
    .eq("player_id", player.id)
    .maybeSingle();
  if (existing) backTo(formData, "?err=checkin_already");

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
  revalidatePath("/my-games");
  backTo(formData, "?checkin=1");
}
