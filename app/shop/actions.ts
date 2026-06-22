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
  CALLSIGN_CHANGE_COST_KEY,
  CALLSIGN_CHANGE_COST_FALLBACK,
  GAME_ENTRY_COST_KEY,
  GAME_ENTRY_COST_FALLBACK,
  callsignChangeIsFree,
} from "@/lib/economy";
import { normalizeCallsign } from "@/lib/validation";
import { getSessionPlayer } from "@/lib/site-player";
import { notifyAdminsPurchase, notifyAdminsGameEntry } from "@/lib/notify";

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

// Зміна позивного за бали. Squad Leader і вище — безкоштовно (перк рангу); решта — за
// settings.callsign_change_cost (дефолт 50). Перейменування + списання роблять ОДИН
// атомарний умовний UPDATE (як buyRank): не списати без зміни і не змінити без списання.
export async function changeCallsign(formData: FormData) {
  if (!(await featureEnabled("shop"))) back("?err=disabled");

  const player = await getSessionPlayer();
  if (!player) redirect("/login");

  const v = normalizeCallsign(String(formData.get("callsign") ?? ""));
  if (!v.ok) return back("?err=callsign_invalid");
  const callsign = v.value;

  // Без зміни (той самий, можливо інший регістр) — не списуємо бали даремно.
  if (player.callsign && callsign.toLowerCase() === String(player.callsign).toLowerCase()) {
    back("?err=callsign_same");
  }

  // Унікальність без урахування регістру (як скрізь), виключаючи себе.
  const { data: clash } = await supabase
    .from("players")
    .select("id")
    .ilike("callsign", callsign)
    .neq("id", player.id)
    .maybeSingle();
  if (clash) back("?err=callsign_taken");

  const free = !!player.has_patch && callsignChangeIsFree(player.rank ?? null);
  const cost = free ? 0 : await getPointValue(CALLSIGN_CHANGE_COST_KEY, CALLSIGN_CHANGE_COST_FALLBACK);

  if (cost > 0) {
    const balance = player.points_balance ?? 0;
    if (balance < cost) back("?err=balance");
    // Атомарне перейменування+списання одним умовним UPDATE по балансу (gte). Нуль
    // зачеплених рядків = недостатньо балів / гонку програно; помилка UNIQUE = зайнятий.
    const { data: changed, error } = await supabase
      .from("players")
      .update({ points_balance: balance - cost, callsign })
      .eq("id", player.id)
      .gte("points_balance", cost)
      .select("id")
      .maybeSingle();
    if (error) back("?err=callsign_taken"); // 23505 (UNIQUE) або інша помилка
    if (!changed) back("?err=balance");
    await supabase
      .from("point_log")
      .insert({ player_id: player.id, delta: -cost, reason: "callsign_change", meta: callsign });
  } else {
    // Безкоштовно (Squad Leader+): просте перейменування; колізія UNIQUE → зайнятий.
    const { error } = await supabase.from("players").update({ callsign }).eq("id", player.id);
    if (error) back("?err=callsign_taken");
  }

  revalidatePath("/shop");
  revalidatePath("/cabinet");
  back("?callsign_changed=1");
}

// Купівля безкоштовного входу на найближчу гру за бали (ціна — settings.game_entry_cost,
// дефолт 100). Атомарне списання, далі сповіщення адмінів із доступом до «гравців» — вони
// надають вхід вручну на найближчій грі. Окремий ентайтлмент НЕ зберігаємо, тож вхід не
// переноситься на наступну гру (як решта покупок: «організатор/адмін видасть»).
export async function buyGameEntry() {
  if (!(await featureEnabled("shop"))) back("?err=disabled");

  const player = await getSessionPlayer();
  if (!player) redirect("/login"); // лише linked-гравець із балансом

  const cost = await getPointValue(GAME_ENTRY_COST_KEY, GAME_ENTRY_COST_FALLBACK);
  // Атомарне списання (захист від double-spend, як у buyItem). false → бракує балів/гонку програно.
  const paid = await spendPoints({ playerId: player.id, amount: cost, reason: "game_entry" });
  if (!paid) back("?err=balance");

  // Сповіщення адмінів із доступом «гравці» (fire-and-forget, як buyItem).
  notifyAdminsGameEntry({
    playerCallsign: player.callsign ?? null,
    playerName: player.name ?? null,
    cost,
  }).catch(() => {});

  revalidatePath("/shop");
  revalidatePath("/cabinet");
  back("?game_entry=1");
}
