"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { featureEnabled } from "@/lib/settings";
import { awardPoints } from "@/lib/economy";
import { getSessionPlayer } from "@/lib/site-player";

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
    .select("id, cost, active")
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

  revalidatePath("/shop");
  revalidatePath("/cabinet");
  back("?bought=1");
}
