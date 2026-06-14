import { supabase } from "./supabase";
import { pickLang, type Lang } from "./i18n";
import { getSetting } from "./settings";

export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

// Знаходить або створює профіль гравця. Оновлює ім'я/нік, бутстрапить майстер-адміна за username.
export async function ensurePlayer(from: TgUser) {
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ") || null;
  const username = from.username ?? null;

  const { data: existing } = await supabase
    .from("players")
    .select("*")
    .eq("tg_user_id", from.id)
    .maybeSingle();

  const masterU = (await getSetting("master_username")) ?? "delltex";
  const isMaster = !!username && username.toLowerCase() === masterU.toLowerCase();

  if (!existing) {
    const lang = pickLang(from.language_code);
    const { data } = await supabase
      .from("players")
      .insert({
        tg_user_id: from.id,
        name,
        tg_username: username,
        lang,
        is_admin: isMaster,
        is_master: isMaster,
      })
      .select("*")
      .single();
    return data!;
  }

  const patch: Record<string, unknown> = { name, tg_username: username };
  if (isMaster && !existing.is_master) {
    patch.is_master = true;
    patch.is_admin = true;
  }
  const { data } = await supabase
    .from("players")
    .update(patch)
    .eq("id", existing.id)
    .select("*")
    .single();
  return data!;
}

export async function setPlayerLang(tgUserId: number, lang: Lang) {
  await supabase.from("players").update({ lang }).eq("tg_user_id", tgUserId);
}

export async function getPlayerByTg(tgUserId: number) {
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("tg_user_id", tgUserId)
    .maybeSingle();
  return data;
}

// Топ гравців за «зароблено всього» (бали); к-сть ігор — поряд як статистика.
export async function getTopPlayers(limit = 10) {
  const { data } = await supabase
    .from("players")
    .select("id, callsign, name, games_played, points_earned")
    .or("points_earned.gt.0,games_played.gt.0")
    .order("points_earned", { ascending: false })
    .order("games_played", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);
  return data ?? [];
}

// Адміни з конкретним правом (майстер має всі права).
export async function getAdminsWithPerm(perm: string) {
  const { data } = await supabase
    .from("players")
    .select("id, tg_user_id, lang, is_master, admin_perms")
    .or(`is_master.eq.true,admin_perms.cs.{${perm}}`);
  return data ?? [];
}

// Місце гравця в рейтингу: к-сть гравців із більшим «зароблено» + 1 (нічиї ділять місце).
export async function getPlayerRank(pointsEarned: number): Promise<number> {
  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gt("points_earned", pointsEarned);
  return (count ?? 0) + 1;
}
