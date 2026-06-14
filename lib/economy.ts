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
