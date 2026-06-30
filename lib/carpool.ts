// Спільна логіка карпулу (Етап 34) — використовують і сайт (app/carpool/actions.ts), і бот (lib/bot.ts).
// Списання місця — АТОМАРНЕ (оптимістичне CAS-блокування, як buyRank): жодного овербукінгу.
import { supabase } from "./supabase";
import type { Lang } from "./i18n";
import {
  notifyDriverRideRequest,
  notifyDriverRideCancelled,
  notifyPassengerRideAccepted,
  notifyPassengerRideEnded,
  notifySeekerNewDriver,
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

// Новий активний водій з'явився на гру → анонімно сповіщаємо всіх, хто ШУКАЄ авто і ще
// не має ПІДТВЕРДЖЕНОЇ поїздки. Викликати лише коли водій щойно став активним (перший пін),
// щоб не спамити (гейт «перший пін» — на боці викликача).
export async function announceDriverToSeekers(gameId: number, driverPlayerId: number): Promise<void> {
  // Водій справді активний (пін + є місця + набір відкритий)?
  const { data: drv } = await supabase
    .from("registrations")
    .select("free_seats, seats_closed, from_lat")
    .eq("game_id", gameId)
    .eq("player_id", driverPlayerId)
    .eq("status", "registered")
    .eq("transport", "own")
    .maybeSingle();
  if (!drv || drv.from_lat == null || drv.seats_closed || (drv.free_seats ?? 0) < 1) return;

  const { data: seekers } = await supabase
    .from("registrations")
    .select("player_id")
    .eq("game_id", gameId)
    .eq("status", "registered")
    .eq("transport", "need");
  if (!seekers?.length) return;

  // Виключаємо тих, у кого вже є підтверджена поїздка.
  const { data: accepted } = await supabase
    .from("ride_requests")
    .select("passenger_id")
    .eq("game_id", gameId)
    .eq("status", "accepted");
  const haveRide = new Set((accepted ?? []).map((r) => r.passenger_id as number));
  const targetIds = seekers
    .map((s) => s.player_id as number)
    .filter((id) => !haveRide.has(id));
  if (!targetIds.length) return;

  const [{ data: game }, { data: players }] = await Promise.all([
    supabase.from("games").select("title").eq("id", gameId).maybeSingle(),
    supabase.from("players").select("tg_user_id, lang").in("id", targetIds),
  ]);
  for (const pl of players ?? []) {
    await notifySeekerNewDriver({
      seekerTgUserId: pl.tg_user_id as number | null,
      seekerLang: (pl.lang as Lang) ?? "uk",
      gameId,
      gameTitle: game?.title ?? null,
    });
  }
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

// Повертає одне вільне місце водієві (після скасування вже ПРИЙНЯТОГО запиту).
async function freeOneSeat(gameId: number, driverPlayerId: number): Promise<void> {
  const { data: reg } = await supabase
    .from("registrations")
    .select("free_seats")
    .eq("game_id", gameId)
    .eq("player_id", driverPlayerId)
    .maybeSingle();
  const cur = reg?.free_seats ?? 0;
  await supabase
    .from("registrations")
    .update({ free_seats: cur + 1 })
    .eq("game_id", gameId)
    .eq("player_id", driverPlayerId);
}

// Пасажир скасовує власну заявку на БУДЬ-ЯКОМУ етапі (pending або вже accepted) — ЄДИНЕ ядро
// для всіх UI карпулу. Якщо запит був прийнятий — повертаємо місце водієві. Завжди сповіщаємо
// водія в ТГ (раніше при відкликанні pending водій нічого не отримував).
export async function cancelOwnRideRequest(
  gameId: number,
  driverPlayerId: number,
  passengerId: number,
): Promise<{ ok: boolean }> {
  const { data: req } = await supabase
    .from("ride_requests")
    .select("id, status")
    .eq("game_id", gameId)
    .eq("driver_player_id", driverPlayerId)
    .eq("passenger_id", passengerId)
    .in("status", ["pending", "accepted"])
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!req) return { ok: false };
  // CAS саме цього статусу — захист від гонки з рішенням водія.
  const { data: done } = await supabase
    .from("ride_requests")
    .update({ status: "cancelled", decided_at: new Date().toISOString() })
    .eq("id", req.id)
    .eq("status", req.status)
    .select("id")
    .maybeSingle();
  if (!done) return { ok: false };
  if (req.status === "accepted") await freeOneSeat(gameId, driverPlayerId);
  const [{ data: pax }, { data: drv }, { data: game }] = await Promise.all([
    supabase.from("players").select("callsign, name").eq("id", passengerId).maybeSingle(),
    supabase.from("players").select("tg_user_id, lang").eq("id", driverPlayerId).maybeSingle(),
    supabase.from("games").select("title").eq("id", gameId).maybeSingle(),
  ]);
  await notifyDriverRideCancelled({
    driverTgUserId: drv?.tg_user_id,
    driverLang: (drv?.lang as Lang) ?? "uk",
    passengerWho: pax?.callsign ?? pax?.name ?? "?",
    gameTitle: game?.title ?? null,
  });
  return { ok: true };
}

// Рішення водія по запиту (прийняти/відхилити) з перевіркою власності — ЄДИНЕ ядро для
// сайту й бота. Саме списання місця лишається в acceptRideRequest (атомарний CAS).
export async function decideRideRequest(
  requestId: number,
  callerDriverId: number,
  decision: "accept" | "decline" | "cancel",
): Promise<{ ok: boolean; reason?: "not_found" | "forbidden" | "not_pending" | "not_accepted" | "full" }> {
  const { data: req } = await supabase
    .from("ride_requests")
    .select("driver_player_id, passenger_id, game_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return { ok: false, reason: "not_found" };
  if (req.driver_player_id !== callerDriverId) return { ok: false, reason: "forbidden" };

  // Водій скасовує ВЖЕ ПРИЙНЯТУ поїздку: звільняємо місце + сповіщаємо пасажира.
  if (decision === "cancel") {
    if (req.status !== "accepted") return { ok: false, reason: "not_accepted" };
    const { data: done } = await supabase
      .from("ride_requests")
      .update({ status: "cancelled", decided_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("status", "accepted")
      .select("id")
      .maybeSingle();
    if (!done) return { ok: false, reason: "not_accepted" };
    await freeOneSeat(req.game_id as number, req.driver_player_id as number);
    const [{ data: pax }, { data: drv }, { data: game }] = await Promise.all([
      supabase.from("players").select("tg_user_id, lang").eq("id", req.passenger_id).maybeSingle(),
      supabase.from("players").select("callsign, name").eq("id", req.driver_player_id).maybeSingle(),
      supabase.from("games").select("title").eq("id", req.game_id).maybeSingle(),
    ]);
    await notifyPassengerRideEnded({
      passengerTgUserId: pax?.tg_user_id,
      passengerLang: (pax?.lang as Lang) ?? "uk",
      key: "ride_cancelled_by_driver_passenger",
      driverWho: drv?.callsign ?? drv?.name ?? "?",
      gameTitle: game?.title ?? null,
    });
    return { ok: true };
  }

  if (req.status !== "pending") return { ok: false, reason: "not_pending" };
  const r =
    decision === "accept" ? await acceptRideRequest(requestId) : await declineRideRequest(requestId);
  return r.ok ? { ok: true } : { ok: false, reason: r.reason as "full" | "not_pending" };
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
