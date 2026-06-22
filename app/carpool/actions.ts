"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { featureEnabled } from "@/lib/settings";
import { getSessionPlayer } from "@/lib/site-player";
import {
  createRideRequest,
  acceptRideRequest,
  declineRideRequest,
  announceDriverToSeekers,
} from "@/lib/carpool";

// Усі дії повертають на /carpool?game=<id> з банером ?ok=… / ?err=… (як кабінет).
function backCarpool(gameId: number, q: string): never {
  return redirect(`/carpool?game=${gameId}${q}`);
}

// Водій ставить/оновлює точку виїзду: пін на мапі (lat/lng із форми) або «моя GPS».
export async function setDeparturePoint(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");
  if (!(await featureEnabled("carpool_map"))) redirect("/");

  const gameId = Number(formData.get("gameId"));
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!Number.isFinite(gameId)) redirect("/carpool");
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    backCarpool(gameId, "&err=geo");
  }

  // Точку виїзду можуть ставити лише водії «своїм ходом», записані на гру.
  const { data: reg } = await supabase
    .from("registrations")
    .select("status, transport, from_lat")
    .eq("game_id", gameId)
    .eq("player_id", player.id)
    .maybeSingle();
  if (!reg || reg.status !== "registered" || reg.transport !== "own") {
    backCarpool(gameId, "&err=not_driver");
  }
  const wasFirstPin = reg!.from_lat == null;

  await supabase
    .from("registrations")
    .update({ from_lat: lat, from_lng: lng })
    .eq("game_id", gameId)
    .eq("player_id", player.id);

  // Перший пін → водій став активним: анонімно сповіщаємо шукачів авто на цю гру.
  if (wasFirstPin) await announceDriverToSeekers(gameId, player.id);
  revalidatePath("/carpool");
  backCarpool(gameId, "&ok=pin");
}

// Пасажир просить місце у водія (вся валідація + DM водію — у createRideRequest).
export async function requestSeat(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");
  if (!(await featureEnabled("carpool_map"))) redirect("/");

  const gameId = Number(formData.get("gameId"));
  const driverPlayerId = Number(formData.get("driverPlayerId"));
  if (!Number.isFinite(gameId) || !Number.isFinite(driverPlayerId)) redirect("/carpool");

  const res = await createRideRequest(gameId, driverPlayerId, player.id);
  revalidatePath("/carpool");
  if (!res.ok) backCarpool(gameId, `&err=${res.reason}`);
  backCarpool(gameId, "&ok=req");
}

// Пасажир скасовує власний pending-запит.
export async function cancelSeatRequest(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");

  const gameId = Number(formData.get("gameId"));
  const driverPlayerId = Number(formData.get("driverPlayerId"));
  if (!Number.isFinite(gameId) || !Number.isFinite(driverPlayerId)) redirect("/carpool");

  await supabase
    .from("ride_requests")
    .update({ status: "cancelled", decided_at: new Date().toISOString() })
    .eq("game_id", gameId)
    .eq("driver_player_id", driverPlayerId)
    .eq("passenger_id", player.id)
    .eq("status", "pending");
  revalidatePath("/carpool");
  backCarpool(gameId, "&ok=cancel");
}

// Водій приймає/відхиляє запит зі сторінки сайту — та сама атомарна логіка, що бот-кнопки.
export async function decideRide(formData: FormData) {
  const player = await getSessionPlayer();
  if (!player) redirect("/login");

  const gameId = Number(formData.get("gameId"));
  const requestId = Number(formData.get("requestId"));
  const decision = String(formData.get("decision") ?? "");
  if (!Number.isFinite(gameId) || !Number.isFinite(requestId)) redirect("/carpool");

  // Рішення може ухвалити лише водій саме цього запиту.
  const { data: req } = await supabase
    .from("ride_requests")
    .select("driver_player_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.driver_player_id !== player.id) backCarpool(gameId, "&err=forbidden");

  if (decision === "accept") {
    const r = await acceptRideRequest(requestId);
    revalidatePath("/carpool");
    backCarpool(gameId, r.ok ? "&ok=accepted" : `&err=${r.reason}`);
  }
  const r = await declineRideRequest(requestId);
  revalidatePath("/carpool");
  backCarpool(gameId, r.ok ? "&ok=declined" : `&err=${r.reason}`);
}
