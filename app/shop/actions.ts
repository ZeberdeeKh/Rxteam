"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { featureEnabled } from "@/lib/settings";
import {
  awardPoints,
  nextRank,
  getPointValue,
  RANK_COST_KEY,
  RANK_COST_FALLBACK,
} from "@/lib/economy";
import { getSessionPlayer } from "@/lib/site-player";
import { notifyAdminsPurchase } from "@/lib/notify";

const back = (q: string) => redirect(`/shop${q}`);

// Купівля товару за доступний баланс: перевірка → списання (point_log) → запис purchase.
export async function buyItem(formData: FormData) {
  if (!(await featureEnabled("shop"))) back("?err=disabled");

  const player = await getSessionPlayer();
  if (!player) redirect("/login"); // лише linked-гравець із балансом

  const itemId = Number(formData.get("itemId"));
  if (!Number.isFinite(itemId)) back("?err=generic");

  const { data: item } = await supabase
    .from("shop_items")
    .select("id, cost, active, title_pl, title_en, title_uk")
    .eq("id", itemId)
    .maybeSingle();
  if (!item || !item.active) back("?err=inactive");

  const cost = item!.cost ?? 0;
  if ((player.points_balance ?? 0) < cost) back("?err=balance");

  await supabase.from("purchases").insert({ player_id: player.id, item_id: itemId, cost });
  // Списання балансу + запис у журнал (awardPoints: delta<0 не множиться, баланс не нижче 0).
  await awardPoints({
    playerId: player.id,
    reason: "purchase",
    baseDelta: -cost,
    meta: `shop:${itemId}`,
    hasPatch: !!player.has_patch,
  });

  // Сповіщення адмінів (fire-and-forget).
  const itemTitle = (item!.title_pl ?? item!.title_en ?? item!.title_uk ?? `#${itemId}`) as string;
  notifyAdminsPurchase({
    playerCallsign: (player as any).callsign ?? null,
    playerName: (player as any).name ?? null,
    itemTitle,
    cost,
  }).catch(() => {});

  revalidatePath("/shop");
  revalidatePath("/cabinet");
  back("?bought=1");
}

// Купівля наступного рангу за бали. Ті самі правила, що й бот /rank:
// потрібен патч, тільки наступний ранг по черзі, ціна з Налаштувань (rank_cost_*).
export async function buyRank(formData: FormData) {
  if (!(await featureEnabled("shop"))) back("?err=disabled");
  if (!(await featureEnabled("economy"))) back("?err=rank_econ_off");

  const player = await getSessionPlayer();
  if (!player) redirect("/login"); // лише linked-гравець із балансом

  // Ранги потребують патч (членство).
  if (!player.has_patch) back("?err=rank_need_patch");

  const current = player.rank ?? "Recruit";
  const next = nextRank(current);
  if (!next) back("?err=rank_max");

  // Захист від гонки: купуємо саме показаний у формі ранг.
  if (String(formData.get("rank") ?? "") !== next) back("?err=rank_changed");

  const cost = await getPointValue(RANK_COST_KEY[next!], RANK_COST_FALLBACK[next!]);
  const balance = player.points_balance ?? 0;
  if (balance < cost) back("?err=rank_balance");

  // Списання + підвищення рангу (як у боті buyrank): point_log + оновлення гравця.
  await supabase
    .from("point_log")
    .insert({ player_id: player.id, delta: -cost, reason: "rank_purchase", meta: next! });
  await supabase
    .from("players")
    .update({ points_balance: balance - cost, rank: next! })
    .eq("id", player.id);

  revalidatePath("/shop");
  revalidatePath("/cabinet");
  back("?rank_bought=1");
}
