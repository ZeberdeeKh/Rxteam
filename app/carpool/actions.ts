"use server";

import { featureEnabled } from "@/lib/settings";
import { getSessionPlayer } from "@/lib/site-player";
import { createRideRequest, decideRideRequest, cancelOwnRideRequest } from "@/lib/carpool";

// Карпул-дії сайту — тонкі обгортки над ядром lib/carpool.ts (та сама логіка, що й у бота,
// щоб стани не розходились). Викликаються імперативно з клієнтської мапи у формі реєстрації
// (мапа всередині <form>, тож вкладена <form action> неможлива) — повертають результат, без redirect.

// Пасажир просить місце у водія (валідація + DM водію — у createRideRequest).
export async function requestRideSeatInline(
  gameId: number,
  driverPlayerId: number,
): Promise<{ ok: boolean; reason?: string }> {
  const player = await getSessionPlayer();
  if (!player) return { ok: false, reason: "auth" };
  if (!(await featureEnabled("carpool_map"))) return { ok: false, reason: "disabled" };
  if (!Number.isFinite(gameId) || !Number.isFinite(driverPlayerId)) return { ok: false, reason: "bad" };
  const res = await createRideRequest(gameId, driverPlayerId, player.id);
  return res.ok ? { ok: true } : { ok: false, reason: res.reason };
}

// Пасажир скасовує власну заявку (pending або вже прийняту) — ядро сповістить водія в ТГ.
export async function cancelRideSeatInline(
  gameId: number,
  driverPlayerId: number,
): Promise<{ ok: boolean }> {
  const player = await getSessionPlayer();
  if (!player) return { ok: false };
  if (!Number.isFinite(gameId) || !Number.isFinite(driverPlayerId)) return { ok: false };
  return cancelOwnRideRequest(gameId, driverPlayerId, player.id);
}

// Водій приймає/відхиляє pending або скасовує вже ПРИЙНЯТУ поїздку — прямо з форми поїздки.
// Те саме ядро (decideRideRequest), що й кнопки бота — без рассинхрону.
export async function acceptRideInline(requestId: number): Promise<{ ok: boolean; reason?: string }> {
  const player = await getSessionPlayer();
  if (!player) return { ok: false, reason: "auth" };
  if (!Number.isFinite(requestId)) return { ok: false, reason: "bad" };
  return decideRideRequest(requestId, player.id, "accept");
}

export async function declineRideInline(requestId: number): Promise<{ ok: boolean; reason?: string }> {
  const player = await getSessionPlayer();
  if (!player) return { ok: false, reason: "auth" };
  if (!Number.isFinite(requestId)) return { ok: false, reason: "bad" };
  return decideRideRequest(requestId, player.id, "decline");
}

// Водій скасовує вже прийняту заявку (повертає місце + сповіщає пасажира — у ядрі).
export async function cancelAcceptedRideInline(requestId: number): Promise<{ ok: boolean; reason?: string }> {
  const player = await getSessionPlayer();
  if (!player) return { ok: false, reason: "auth" };
  if (!Number.isFinite(requestId)) return { ok: false, reason: "bad" };
  return decideRideRequest(requestId, player.id, "cancel");
}
