import { supabase } from "./supabase";
import { getSetting, featureEnabled } from "./settings";

// Звання за порядком зростання (вхідне — Recruit, дається з патчем).
export const RANKS = ["Recruit", "Scout", "Squad Leader", "Team Leader"] as const;
export type Rank = (typeof RANKS)[number];

// Ключі вартості наступних звань (Recruit — безкоштовне з патчем).
export const RANK_COST_KEY: Record<string, string> = {
  Scout: "rank_cost_scout",
  "Squad Leader": "rank_cost_squad",
  "Team Leader": "rank_cost_team",
};

// Запасні вартості (якщо settings порожні).
export const RANK_COST_FALLBACK: Record<string, number> = {
  Scout: 100,
  "Squad Leader": 250,
  "Team Leader": 500,
};

// Числове значення з settings зі знаком; fallback якщо не задано/невалідне.
export async function getPointValue(key: string, fallback: number): Promise<number> {
  const v = await getSetting(key);
  const n = v === null || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Наступне звання після поточного (null якщо вже максимум).
export function nextRank(current: string | null): Rank | null {
  const idx = current ? RANKS.indexOf(current as Rank) : -1;
  return idx + 1 < RANKS.length ? RANKS[idx + 1] : null;
}

type AwardOpts = {
  playerId: number;
  reason: string;
  baseDelta: number; // базове значення зі знаком (заробіток >0, штраф <0)
  gameId?: number | null;
  meta?: string | null;
  hasPatch?: boolean; // якщо відомо — щоб не робити зайвий запит
};

// Нараховує/списує бали: пише в point_log і оновлює агрегати гравця.
// Заробіток (delta>0) множиться на 0.85 без патча; штрафи (delta<0) — без множника.
// «Зароблено всього» (points_earned) лише росте; «Баланс» (points_balance) міняється на delta (≥0).
export async function awardPoints(opts: AwardOpts): Promise<number> {
  if (!(await featureEnabled("economy"))) return 0;

  let delta = opts.baseDelta;
  if (delta > 0) {
    let hasPatch = opts.hasPatch;
    if (hasPatch === undefined) {
      const { data } = await supabase
        .from("players")
        .select("has_patch")
        .eq("id", opts.playerId)
        .single();
      hasPatch = !!data?.has_patch;
    }
    if (!hasPatch) {
      const mult = await getPointValue("no_patch_multiplier", 0.85);
      delta = Math.round(delta * mult);
    }
  }
  if (delta === 0) return 0;

  await supabase.from("point_log").insert({
    player_id: opts.playerId,
    delta,
    reason: opts.reason,
    game_id: opts.gameId ?? null,
    meta: opts.meta ?? null,
  });

  const { data: p } = await supabase
    .from("players")
    .select("points_earned, points_balance")
    .eq("id", opts.playerId)
    .single();
  const earned = (p?.points_earned ?? 0) + (delta > 0 ? delta : 0); // lifetime, тільки вгору
  const balance = Math.max(0, (p?.points_balance ?? 0) + delta); // гаманець, не нижче 0
  await supabase
    .from("players")
    .update({ points_earned: earned, points_balance: balance })
    .eq("id", opts.playerId);

  return delta;
}

export type GrantedAch = {
  code: string;
  title_pl: string | null;
  title_en: string | null;
  title_uk: string | null;
  points: number; // фактично нараховано (з урахуванням патча)
};

async function tierPoints(tier: string): Promise<number> {
  if (tier === "easy") return getPointValue("pts_ach_easy", 5);
  if (tier === "hard") return getPointValue("pts_ach_hard", 20);
  return getPointValue("pts_ach_mid", 10);
}

// Видає ачівку, якщо її ще нема і вона ввімкнена. Нараховує бали за tier.
// Повертає дані для нотифікації або null (вже є / вимкнено / гонка).
export async function grantAchievement(
  playerId: number,
  code: string,
  gameId?: number | null,
  hasPatch?: boolean,
): Promise<GrantedAch | null> {
  if (!(await featureEnabled("achievements"))) return null;
  const { data: ach } = await supabase
    .from("achievements")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!ach || !ach.enabled) return null;
  const { data: have } = await supabase
    .from("player_achievements")
    .select("id")
    .eq("player_id", playerId)
    .eq("code", code)
    .maybeSingle();
  if (have) return null;
  const { error } = await supabase
    .from("player_achievements")
    .insert({ player_id: playerId, code, game_id: gameId ?? null });
  if (error) return null; // unique-гонка
  const base = await tierPoints(ach.tier);
  const delta = await awardPoints({
    playerId,
    reason: "achievement",
    baseDelta: base,
    gameId: gameId ?? null,
    meta: code,
    hasPatch,
  });
  return {
    code,
    title_pl: ach.title_pl,
    title_en: ach.title_en,
    title_uk: ach.title_uk,
    points: delta,
  };
}

// Визначає й видає ачівки за чек-ін. gamesPlayedAfter — нове значення games_played.
// earlyMinutes — хвилини від відкриття вікна чек-іну (для dawn_patrol); null → пропустити (ручний чек-ін).
export async function grantCheckinAchievements(opts: {
  playerId: number;
  gameId: number;
  gamesPlayedAfter: number;
  hasPatch?: boolean;
  earlyMinutes?: number | null;
}): Promise<GrantedAch[]> {
  const out: GrantedAch[] = [];
  const tryGrant = async (code: string) => {
    const g = await grantAchievement(opts.playerId, code, opts.gameId, opts.hasPatch);
    if (g) out.push(g);
  };
  if (opts.gamesPlayedAfter >= 1) await tryGrant("first_contact");
  if (opts.gamesPlayedAfter >= 10) await tryGrant("deploy_10");
  if (opts.gamesPlayedAfter >= 25) await tryGrant("deploy_25");
  if (opts.gamesPlayedAfter >= 50) await tryGrant("deploy_50");
  if (opts.earlyMinutes != null && opts.earlyMinutes >= 0 && opts.earlyMinutes <= 10) {
    await tryGrant("dawn_patrol");
  }
  return out;
}

// Надійність: явки/(явки+неявки) за весь час. null якщо ще нема даних.
export async function getReliability(
  playerId: number,
): Promise<{ pct: number | null; attended: number; noShow: number }> {
  const { count: att } = await supabase
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .eq("player_id", playerId);
  const { count: ns } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("player_id", playerId)
    .eq("status", "no_show");
  const a = att ?? 0;
  const n = ns ?? 0;
  const total = a + n;
  return { pct: total ? Math.round((a / total) * 100) : null, attended: a, noShow: n };
}
