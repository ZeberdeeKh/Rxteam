"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { featureEnabled } from "@/lib/settings";
import {
  spendPoints,
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
  // Атомарне списання балів ДО запису покупки. Інакше паралельні запити (подвійний клік /
  // скрипт) проходять перевірку по снапшоту й дають кілька покупок за один баланс
  // (double-spend). spendPoints списує рівно один раз і лише якщо балансу досі вистачає.
  if (cost > 0) {
    const paid = await spendPoints({
      playerId: player.id,
      amount: cost,
      reason: "purchase",
      meta: `shop:${itemId}`,
    });
    if (!paid) back("?err=balance");
  }
  await supabase.from("purchases").insert({ player_id: player.id, item_id: itemId, cost });

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

  // Атомарне підвищення: умовний UPDATE по балансу І поточному рангу. Рядок зміниться
  // лише якщо ранг ДОСІ = current і балансу вистачає — це закриває і double-spend, і
  // гонку «купити два ранги одразу». Нуль зачеплених рядків → відмова (rank_changed).
  let upd = supabase
    .from("players")
    .update({ points_balance: balance - cost, rank: next! })
    .eq("id", player.id)
    .gte("points_balance", cost);
  upd = player.rank == null ? upd.is("rank", null) : upd.eq("rank", player.rank);
  const { data: changed } = await upd.select("id").maybeSingle();
  if (!changed) back("?err=rank_changed");

  // Журнал списання — лише після успішного атомарного підвищення.
  await supabase
    .from("point_log")
    .insert({ player_id: player.id, delta: -cost, reason: "rank_purchase", meta: next! });

  revalidatePath("/shop");
  revalidatePath("/cabinet");
  back("?rank_bought=1");
}
