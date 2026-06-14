import { cookies } from "next/headers";
import { supabase } from "./supabase";
import { getAuthUser } from "./supabase-server";
import { getPlayerIdByAuthUser } from "./identities";
import { readTgSession, TG_SESSION_COOKIE } from "./tg-session";

export type SessionContext =
  | { state: "anon" }
  | { state: "unlinked"; authUserId: string; email: string | null }
  | { state: "linked"; authUserId: string; email: string | null; player: Record<string, any> };

async function fetchPlayer(id: number) {
  const { data } = await supabase.from("players").select("*").eq("id", id).maybeSingle();
  return data;
}

// Єдиний резолвер для серверкомпонентів сайту:
//  anon → не залогінений; unlinked → email-сесія без прив'язки до player;
//  linked → вхід через Telegram або email, прив'язаний до TG-профілю.
export async function getSessionContext(): Promise<SessionContext> {
  // 1) Власна TG-сесія (вхід через Telegram-віджет).
  const tgPlayerId = readTgSession(cookies().get(TG_SESSION_COOKIE)?.value);
  if (tgPlayerId) {
    const player = await fetchPlayer(tgPlayerId);
    if (player) return { state: "linked", authUserId: `tg:${tgPlayerId}`, email: null, player };
  }

  // 2) Email-сесія Supabase.
  const user = await getAuthUser();
  if (!user) return { state: "anon" };

  const playerId = await getPlayerIdByAuthUser(user.id);
  if (!playerId) return { state: "unlinked", authUserId: user.id, email: user.email ?? null };

  const player = await fetchPlayer(playerId);
  if (!player) return { state: "unlinked", authUserId: user.id, email: user.email ?? null };

  return { state: "linked", authUserId: user.id, email: user.email ?? null, player };
}
