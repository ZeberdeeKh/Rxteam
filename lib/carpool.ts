// Спільна логіка карпулу (Етап 34) — використовують і сайт (app/carpool/actions.ts), і бот (lib/bot.ts).
// Списання місця — АТОМАРНЕ (оптимістичне CAS-блокування, як buyRank): жодного овербукінгу.
import { supabase } from "./supabase";
import type { Lang } from "./i18n";
import {
  notifyDriverRideRequest,
  notifyPassengerRideAccepted,
  notifyPassengerRideEnded,
} from "./notify";

// Та сама межа «минулої гри», що в боті (myUpcomingGames) — ~3 год після старту.
const PAST_CUTOFF_MS = 3 * 3600 * 1000;

export type RideCreateResult =
  | { ok: true; requestId: number }
  | { ok: false; reason: "self" | "duplicate" | "closed" | "full" | "game_past" | "driver_not_found" };

// Пасажир просить місце у водія. Валідація + вставка ride_requests + DM водію з кнопками.
// 23505 (партійний UNIQUE uq_ride_req_open) → вже є відкритий запит цьому водієві.
export async function createRideRequest(
  gameId: number,
  driverPlayerId: number,
  passengerId: number,
): Promise<RideCreateResult> {
  if (driverPlayerId === passengerId) return { ok: false, reason: "self" };

  const { data: game } = await supabase
    .from("games")
    .select("status, start_at, title")
    .eq("id", gameId)
    .maybeSingle();
  if (
    !game ||
    game.status !== "announced" ||
    new Date(game.start_at).getTime() < Date.now() - PAST_CUTOFF_MS
  ) {
    return { ok: false, reason: "game_past" };
  }

  // Водій має бути зареєстрований «своїм ходом» і пропонувати місця.
  const { data: drv } = await supabase
    .from("registrations")
    .select("free_seats, seats_closed, players(callsign, name, tg_user_id, lang)")
    .eq("game_id", gameId)
    .eq("player_id", driverPlayerId)
    .eq("status", "registered")
    .eq("transport", "own")
    .maybeSingle();
  if (!drv) return { ok: false, reason: "driver_not_found" };
  if (drv.seats_closed) return { ok: false, reason: "closed" };
  if ((drv.free_seats ?? 0) < 1) return { ok: false, reason: "full" };

  const { data: row, error } = await supabase
    .from("ride_requests")
    .insert({
      game_id: gameId,
      driver_player_id: driverPlayerId,
      passenger_id: passengerId,
      status: "pending",
      seats: 1,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, reason: error?.code === "23505" ? "duplicate" : "full" };

  const { data: pax } = await supabase
    .from("players")
    .select("callsign, name, tg_user_id, tg_username")
    .eq("id", passengerId)
    .maybeSingle();
  const dpl = (drv as any).players;
  await notifyDriverRideRequest({
    requestId: row.id as number,
    driverTgUserId: dpl?.tg_user_id,
    driverLang: (dpl?.lang as Lang) ?? "uk",
    passengerWho: pax?.callsign ?? pax?.name ?? "?",
    passengerTgUserId: pax?.tg_user_id,
    passengerTgUsername: pax?.tg_username,
    gameTitle: game.title ?? null,
  });
  return { ok: true, requestId: row.id as number };
}

export type RideDecisionResult =
  | { ok: true; gameId: number; driverPlayerId: number; passengerId: number; gameTitle: string | null }
  | { ok: false; reason: "not_found" | "not_pending" | "full" };

// Водій ПРИЙМАЄ запит. Місце списується атомарно (CAS) — рівно одне, без овербукінгу.
export async function acceptRideRequest(requestId: number): Promise<RideDecisionResult> {
  const { data: req } = await supabase
    .from("ride_requests")
    .select("game_id, driver_player_id, passenger_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return { ok: false, reason: "not_found" };
  if (req.status !== "pending") return { ok: false, reason: "not_pending" };

  const { data: reg } = await supabase
    .from("registrations")
    .select("free_seats, seats_closed")
    .eq("game_id", req.game_id)
    .eq("player_id", req.driver_player_id)
    .maybeSingle();
  const current = reg?.free_seats ?? 0;
  if (!reg || reg.seats_closed || current < 1) return { ok: false, reason: "full" };

  // CAS-декремент: спрацює лише якщо лічильник не змінився між читанням і записом.
  const { data: dec } = await supabase
    .from("registrations")
    .update({ free_seats: current - 1 })
    .eq("game_id", req.game_id)
    .eq("player_id", req.driver_player_id)
    .eq("free_seats", current)
    .eq("seats_closed", false)
    .select("game_id")
    .maybeSingle();
  if (!dec) return { ok: false, reason: "full" }; // паралельно забрали останнє місце

  // CAS-перехід запиту pending→accepted (захист від подвійного accept того ж запиту).
  const { data: acc } = await supabase
    .from("ride_requests")
    .update({ status: "accepted", decided_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!acc) {
    // Запит уже опрацьовано паралельно — повертаємо щойно зняте місце (best-effort CAS).
    await supabase
      .from("registrations")
      .update({ free_seats: current })
      .eq("game_id", req.game_id)
      .eq("player_id", req.driver_player_id)
      .eq("free_seats", current - 1);
    return { ok: false, reason: "not_pending" };
  }

  const [{ data: pax }, { data: drv }, { data: game }] = await Promise.all([
    supabase.from("players").select("tg_user_id, lang").eq("id", req.passenger_id).maybeSingle(),
    supabase
      .from("players")
      .select("callsign, name, tg_username, tg_user_id")
      .eq("id", req.driver_player_id)
      .maybeSingle(),
    supabase.from("games").select("title").eq("id", req.game_id).maybeSingle(),
  ]);
  await notifyPassengerRideAccepted({
    passengerTgUserId: pax?.tg_user_id,
    passengerLang: (pax?.lang as Lang) ?? "uk",
    driverWho: drv?.callsign ?? drv?.name ?? "?",
    driverTgUsername: drv?.tg_username,
    driverTgUserId: drv?.tg_user_id,
    gameTitle: game?.title ?? null,
  });
  return {
    ok: true,
    gameId: req.game_id as number,
    driverPlayerId: req.driver_player_id as number,
    passengerId: req.passenger_id as number,
    gameTitle: game?.title ?? null,
  };
}

// Водій ВІДХИЛЯЄ запит. Місце не чіпаємо.
export async function declineRideRequest(requestId: number): Promise<RideDecisionResult> {
  const { data: dec } = await supabase
    .from("ride_requests")
    .update({ status: "declined", decided_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("game_id, driver_player_id, passenger_id")
    .maybeSingle();
  if (!dec) return { ok: false, reason: "not_pending" };

  const [{ data: pax }, { data: drv }, { data: game }] = await Promise.all([
    supabase.from("players").select("tg_user_id, lang").eq("id", dec.passenger_id).maybeSingle(),
    supabase.from("players").select("callsign, name").eq("id", dec.driver_player_id).maybeSingle(),
    supabase.from("games").select("title").eq("id", dec.game_id).maybeSingle(),
  ]);
  await notifyPassengerRideEnded({
    passengerTgUserId: pax?.tg_user_id,
    passengerLang: (pax?.lang as Lang) ?? "uk",
    key: "ride_declined_passenger",
    driverWho: drv?.callsign ?? drv?.name ?? "?",
    gameTitle: game?.title ?? null,
  });
  return {
    ok: true,
    gameId: dec.game_id as number,
    driverPlayerId: dec.driver_player_id as number,
    passengerId: dec.passenger_id as number,
    gameTitle: game?.title ?? null,
  };
}

// Водій знявся з гри → скасовуємо всі його pending/accepted запити й сповіщаємо пасажирів.
// Викликається з відписки (сайт app/cabinet/actions.ts і бот unreg). Місця не повертаємо —
// реєстрація водія (а з нею і free_seats) усе одно стає cancelled.
export async function cancelDriverRideRequests(
  gameId: number,
  driverPlayerId: number,
): Promise<void> {
  const { data: affected } = await supabase
    .from("ride_requests")
    .update({ status: "cancelled", decided_at: new Date().toISOString() })
    .eq("game_id", gameId)
    .eq("driver_player_id", driverPlayerId)
    .in("status", ["pending", "accepted"])
    .select("passenger_id");
  if (!affected?.length) return;

  const [{ data: drv }, { data: game }] = await Promise.all([
    supabase.from("players").select("callsign, name").eq("id", driverPlayerId).maybeSingle(),
    supabase.from("games").select("title").eq("id", gameId).maybeSingle(),
  ]);
  const ids = [...new Set(affected.map((a) => a.passenger_id as number))];
  const { data: paxes } = await supabase
    .from("players")
    .select("id, tg_user_id, lang")
    .in("id", ids);
  for (const pax of paxes ?? []) {
    await notifyPassengerRideEnded({
      passengerTgUserId: pax.tg_user_id as number | null,
      passengerLang: (pax.lang as Lang) ?? "uk",
      key: "ride_driver_left_passenger",
      driverWho: drv?.callsign ?? drv?.name ?? "?",
      gameTitle: game?.title ?? null,
    });
  }
}
