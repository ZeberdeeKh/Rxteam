import { supabase } from "./supabase";
import { getSessionContext } from "./session-player";
import { getServerLang } from "./server-lang";
import { normalizeCallsign } from "./validation";

// Серверні хелпери «сесія → player» для дій кабінету (реєстрація, чек-ін, магазин).
// Рішення організатора (2026-06-15): для email-юзера без TG створюємо standalone-профіль.

export type SitePlayer = Record<string, any>;

// player поточної linked-сесії, або null (anon/unlinked).
export async function getSessionPlayer(): Promise<SitePlayer | null> {
  const ctx = await getSessionContext();
  return ctx.state === "linked" ? ctx.player : null;
}

export type EnsureResult =
  | { ok: true; player: SitePlayer }
  | { ok: false; reason: "anon" | "db" };

// Створює standalone-профіль для unlinked email-сесії (player без tg_user_id + email-ідентичність).
// Для linked — просто повертає наявний профіль. Для anon — помилка.
export async function createStandalonePlayerForSession(): Promise<EnsureResult> {
  const ctx = await getSessionContext();
  if (ctx.state === "linked") return { ok: true, player: ctx.player };
  if (ctx.state !== "unlinked") return { ok: false, reason: "anon" };

  const name = ctx.email ? ctx.email.split("@")[0] : null;
  const { data: player, error } = await supabase
    .from("players")
    .insert({ name, lang: getServerLang() })
    .select("*")
    .single();
  if (error || !player) return { ok: false, reason: "db" };

  await supabase.from("identities").upsert(
    { player_id: player.id, provider: "email", external_id: ctx.authUserId, verified: true },
    { onConflict: "provider,external_id" },
  );
  return { ok: true, player };
}

// Призначає унікальний позивний (перший раз — у боті це робиться при першій реєстрації).
export async function setCallsignForPlayer(
  playerId: number,
  rawCallsign: string,
): Promise<{ ok: true } | { ok: false; reason: "empty" | "taken" }> {
  const v = normalizeCallsign(rawCallsign);
  if (!v.ok) return { ok: false, reason: "empty" }; // довжина/charset/контрол-символи
  const callsign = v.value;

  // Перевірка унікальності (callsign unique у БД; ловимо ще й гонку через error).
  const { data: clash } = await supabase
    .from("players")
    .select("id")
    .ilike("callsign", callsign)
    .neq("id", playerId)
    .maybeSingle();
  if (clash) return { ok: false, reason: "taken" };

  const { error } = await supabase.from("players").update({ callsign }).eq("id", playerId);
  if (error) return { ok: false, reason: "taken" };
  return { ok: true };
}
