import { supabase } from "./supabase";
import { getAuthUser } from "./supabase-server";
import { getPlayerIdByAuthUser } from "./identities";

export type SessionContext =
  | { state: "anon" }
  | { state: "unlinked"; authUserId: string; email: string | null }
  | { state: "linked"; authUserId: string; email: string | null; player: Record<string, any> };

// Єдиний резолвер для серверкомпонентів сайту:
//  anon → не залогінений; unlinked → email-сесія без прив'язки до player;
//  linked → email-сесія, прив'язана до TG-профілю.
export async function getSessionContext(): Promise<SessionContext> {
  const user = await getAuthUser();
  if (!user) return { state: "anon" };

  const playerId = await getPlayerIdByAuthUser(user.id);
  if (!playerId) return { state: "unlinked", authUserId: user.id, email: user.email ?? null };

  const { data: player } = await supabase.from("players").select("*").eq("id", playerId).maybeSingle();
  if (!player) return { state: "unlinked", authUserId: user.id, email: user.email ?? null };

  return { state: "linked", authUserId: user.id, email: user.email ?? null, player };
}
