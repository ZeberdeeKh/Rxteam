"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { setSetting, getSetting } from "@/lib/settings";
import { requirePerm, requireMaster, ALL_PERMS } from "@/lib/admin";
import { TOGGLE_KEYS, VALUE_KEYS, PATCH_TOGGLE_KEYS, PATCH_VALUE_KEYS } from "@/lib/admin-settings";
import { notifyPlayerPatch } from "@/lib/notify";
import { tr } from "@/lib/strings";
import { getPlayerByTg } from "@/lib/players";
import type { Lang } from "@/lib/i18n";
import { SOCIALS } from "@/lib/social";
import { makeUtc, computeWindows, getCheckinWindow } from "@/lib/games";
import { announceGame } from "@/lib/game-announce";
import { Api } from "grammy";
import { performCheckin } from "@/lib/checkins";
import { setCallsignForPlayer } from "@/lib/site-player";
import { REPLICA_CODES, PYRO_STATES, FIRE_MODES } from "@/lib/replicas";
import { grantAchievement as grantAch } from "@/lib/economy";

const back2 = (q: string) => redirect(`/admin/locations${q}`);

// ── Налаштування + соцмережі (майстер) ──
// Соцмережі раніше були окремим розділом /admin/social — тепер це секція в «Налаштуваннях»,
// тому зберігаємо їх у тій самій дії (лінки виводяться на лендінгу → revalidate "/").
export async function saveSettings(formData: FormData) {
  await requireMaster();
  // Старі значення вікна чек-іну — щоб після збереження зрозуміти, чи їх змінили.
  const beforeOld = await getSetting("checkin_open_before_min");
  const afterOld = await getSetting("checkin_close_after_min");

  for (const key of TOGGLE_KEYS) {
    await setSetting(key, formData.get(key) === "on" ? "true" : "false");
  }
  for (const key of VALUE_KEYS) {
    const v = formData.get(key);
    if (v !== null) await setSetting(key, String(v));
  }
  for (const s of SOCIALS) {
    const v = formData.get(s.settingKey);
    if (v !== null) await setSetting(s.settingKey, String(v).trim());
  }

  // Якщо вікно чек-іну змінилось — перераховуємо checkin_from/checkin_to для всіх
  // анонсованих майбутніх ігор (reg_closes/cancel не чіпаємо). Минулі ігри лишаємо як є.
  const beforeNew = formData.get("checkin_open_before_min");
  const afterNew = formData.get("checkin_close_after_min");
  if (
    (beforeNew !== null && String(beforeNew) !== (beforeOld ?? "")) ||
    (afterNew !== null && String(afterNew) !== (afterOld ?? ""))
  ) {
    const cw = await getCheckinWindow();
    const { data: future } = await supabase
      .from("games")
      .select("id, gather_at, start_at")
      .eq("status", "announced")
      .gt("start_at", new Date().toISOString());
    for (const g of future ?? []) {
      const w = computeWindows((g as any).gather_at ?? g.start_at, g.start_at, cw);
      await supabase
        .from("games")
        .update({ checkin_from: w.checkin_from, checkin_to: w.checkin_to })
        .eq("id", g.id);
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/"); // лендінг показує соц-лінки
  redirect("/admin/settings?saved=1");
}

// ── Ігри (право games) ──
export async function createGame(formData: FormData) {
  await requirePerm("games");
  const locationId = Number(formData.get("locationId"));
  const date = String(formData.get("date") ?? "");
  const gather = String(formData.get("gather") ?? "");
  const start = String(formData.get("start") ?? "");
  if (!Number.isFinite(locationId) || !date || !gather || !start) {
    redirect("/admin/games?err=fields");
  }
  const capRaw = Number(formData.get("capacity"));
  const capacity = Number.isFinite(capRaw) && capRaw > 0 ? capRaw : null;

  const gatherUtc = makeUtc(date, gather);
  const startUtc = makeUtc(date, start);
  const w = computeWindows(gatherUtc, startUtc, await getCheckinWindow());

  const { data: game } = await supabase
    .from("games")
    .insert({
      location_id: locationId,
      title: String(formData.get("title") ?? "").trim() || null,
      scenario_pl: String(formData.get("scenario_pl") ?? "").trim() || null,
      scenario_uk: String(formData.get("scenario_uk") ?? "").trim() || null,
      gather_at: gatherUtc,
      start_at: startUtc,
      reg_closes_at: w.reg_closes_at,
      cancel_deadline: w.cancel_deadline,
      checkin_from: w.checkin_from,
      checkin_to: w.checkin_to,
      capacity,
      status: "announced",
    })
    .select("id")
    .single();
  revalidatePath("/admin/games");

  // Той самий шлях, що й /newgame у боті: анонс у «Анонси» + чек-лист у адмін-групу.
  // Best-effort — збій постингу не має ламати створення гри (гра вже в БД). У server
  // action немає ctx, тому даємо власний grammy Api на BOT_TOKEN (lib/game-announce.ts).
  if (game) {
    try {
      await announceGame(new Api(process.env.BOT_TOKEN!), game.id);
    } catch (e) {
      console.error("createGame: announceGame failed", e);
    }
  }
  redirect("/admin/games?created=1");
}

export async function cancelGame(formData: FormData) {
  await requirePerm("games");
  const gameId = Number(formData.get("gameId"));
  if (Number.isFinite(gameId)) {
    await supabase.from("games").update({ status: "cancelled" }).eq("id", gameId);
    // Скасування гри прибирає й активні реєстрації — інакше у гравців лишаються «записи»
    // на скасовану гру (видно у /drivers, /myride і кабінеті на сайті).
    await supabase
      .from("registrations")
      .update({ status: "cancelled" })
      .eq("game_id", gameId)
      .eq("status", "registered");
    revalidatePath("/admin/games");
  }
  redirect("/admin/games?cancelled=1");
}

// ── Локації (право games) ──
function mapUrl(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

// Поля локації для анонсу: допущені типи реплік, піро (+уточнення), режим вогню,
// а також двомовний текст блоку «Оплата» (per-location, виводиться перед disclaimer).
function parseLimits(formData: FormData) {
  const replica_types = formData
    .getAll("replica_types")
    .map(String)
    .filter((c) => (REPLICA_CODES as readonly string[]).includes(c));
  const pyroRaw = String(formData.get("pyro") ?? "no");
  const pyro = (PYRO_STATES as readonly string[]).includes(pyroRaw) ? pyroRaw : "no";
  const fireRaw = String(formData.get("fire_mode") ?? "semi");
  const fire_mode = (FIRE_MODES as readonly string[]).includes(fireRaw) ? fireRaw : "semi";
  const pyro_note_pl = String(formData.get("pyro_note_pl") ?? "").trim() || null;
  const pyro_note_uk = String(formData.get("pyro_note_uk") ?? "").trim() || null;
  const payment_pl = String(formData.get("payment_pl") ?? "").trim() || null;
  const payment_uk = String(formData.get("payment_uk") ?? "").trim() || null;
  return { replica_types, pyro, pyro_note_pl, pyro_note_uk, fire_mode, payment_pl, payment_uk };
}

export async function createLocation(formData: FormData) {
  await requirePerm("locations");
  const name = String(formData.get("name") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const radiusRaw = Number(formData.get("radius_m"));
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) back2("?err=fields");
  const radius_m = Number.isFinite(radiusRaw) && radiusRaw > 0 ? Math.round(radiusRaw) : 300;
  await supabase
    .from("locations")
    .insert({ name, lat, lng, radius_m, map_url: mapUrl(lat, lng), ...parseLimits(formData) });
  revalidatePath("/admin/locations");
  back2("?created=1");
}

export async function updateLocation(formData: FormData) {
  await requirePerm("locations");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const radiusRaw = Number(formData.get("radius_m"));
  if (!Number.isFinite(id) || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) back2("?err=fields");
  const radius_m = Number.isFinite(radiusRaw) && radiusRaw > 0 ? Math.round(radiusRaw) : 300;
  await supabase
    .from("locations")
    .update({ name, lat, lng, radius_m, map_url: mapUrl(lat, lng), ...parseLimits(formData) })
    .eq("id", id);
  revalidatePath("/admin/locations");
  back2("?saved=1");
}

export async function deleteLocation(formData: FormData) {
  await requirePerm("locations");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) back2("");
  // Не видаляємо, якщо локація вже використана в іграх (FK + збереження історії).
  const { count } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("location_id", id);
  if ((count ?? 0) > 0) back2("?err=inuse");
  await supabase.from("locations").delete().eq("id", id);
  revalidatePath("/admin/locations");
  back2("?deleted=1");
}

// ── Чек-лист підготовки до гри (Етап 13, право chores) ──
const backChores = (q: string) => redirect(`/admin/chores${q}`);

function parseChoreKind(formData: FormData): "action" | "gear" | null {
  const raw = String(formData.get("kind") ?? "");
  return raw === "action" || raw === "gear" ? raw : null;
}

export async function createChore(formData: FormData) {
  await requirePerm("chores");
  const kind = parseChoreKind(formData);
  const label = String(formData.get("label") ?? "").trim();
  if (!kind || !label) backChores("?err=fields");
  const note = String(formData.get("note") ?? "").trim() || null;
  const sortRaw = Number(formData.get("sort_order"));
  const sort_order = Number.isFinite(sortRaw) ? Math.round(sortRaw) : 0;
  await supabase.from("chore_templates").insert({ kind, label, note, sort_order, active: true });
  revalidatePath("/admin/chores");
  backChores("?created=1");
}

export async function updateChore(formData: FormData) {
  await requirePerm("chores");
  const id = Number(formData.get("id"));
  const kind = parseChoreKind(formData);
  const label = String(formData.get("label") ?? "").trim();
  if (!Number.isFinite(id) || !kind || !label) backChores("?err=fields");
  const note = String(formData.get("note") ?? "").trim() || null;
  const sortRaw = Number(formData.get("sort_order"));
  const sort_order = Number.isFinite(sortRaw) ? Math.round(sortRaw) : 0;
  const active = formData.get("active") === "on";
  await supabase
    .from("chore_templates")
    .update({ kind, label, note, sort_order, active })
    .eq("id", id);
  revalidatePath("/admin/chores");
  backChores("?saved=1");
}

export async function deleteChore(formData: FormData) {
  await requirePerm("chores");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) backChores("");
  // Знімок пунктів зберігається в chore_run_items — видалення шаблону не чіпає минулі run.
  await supabase.from("chore_templates").delete().eq("id", id);
  revalidatePath("/admin/chores");
  backChores("?deleted=1");
}

// ── Реєстрації / чек-іни наживо (право games) ──
export async function manualCheckin(formData: FormData) {
  await requirePerm("games");
  const gameId = Number(formData.get("gameId"));
  const playerId = Number(formData.get("playerId"));
  if (!Number.isFinite(gameId) || !Number.isFinite(playerId)) redirect("/admin/games");

  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .maybeSingle();
  if (!existing) {
    const { data: target } = await supabase
      .from("players")
      .select("id, callsign, name, games_played, has_patch")
      .eq("id", playerId)
      .single();
    if (target) {
      await performCheckin({
        player: target,
        gameId,
        source: "manual",
        isManual: true,
        earlyMinutes: null,
      });
    }
  }
  revalidatePath(`/admin/games/${gameId}`);
  redirect(`/admin/games/${gameId}?checked=1`);
}

export async function markNoShow(formData: FormData) {
  await requirePerm("games");
  const gameId = Number(formData.get("gameId"));
  const playerId = Number(formData.get("playerId"));
  if (Number.isFinite(gameId) && Number.isFinite(playerId)) {
    await supabase
      .from("registrations")
      .update({ status: "no_show" })
      .eq("game_id", gameId)
      .eq("player_id", playerId);
    revalidatePath(`/admin/games/${gameId}`);
  }
  redirect(`/admin/games/${gameId}?noshow=1`);
}

// ── Гравці (право players) ──
export async function adjustPoints(formData: FormData) {
  await requirePerm("players");
  const playerId = Number(formData.get("playerId"));
  const delta = Number(formData.get("delta"));
  if (!Number.isFinite(playerId) || !Number.isFinite(delta) || delta === 0) {
    redirect("/admin/players?err=fields");
  }
  // Пряма корекція (без множника 0.85): earned лише вгору, balance не нижче 0.
  await supabase.from("point_log").insert({ player_id: playerId, delta, reason: "manual" });
  const { data: p } = await supabase
    .from("players")
    .select("points_earned, points_balance")
    .eq("id", playerId)
    .single();
  await supabase
    .from("players")
    .update({
      points_earned: (p?.points_earned ?? 0) + (delta > 0 ? delta : 0),
      points_balance: Math.max(0, (p?.points_balance ?? 0) + delta),
    })
    .eq("id", playerId);
  revalidatePath("/admin/players");
  redirect("/admin/players?adjusted=1");
}

export async function setPlayerCallsign(formData: FormData) {
  await requirePerm("players");
  const playerId = Number(formData.get("playerId"));
  const res = await setCallsignForPlayer(playerId, String(formData.get("callsign") ?? ""));
  revalidatePath("/admin/players");
  redirect(`/admin/players?${res.ok ? "callsign=1" : `err=callsign_${res.reason}`}`);
}

export async function togglePatch(formData: FormData) {
  const me = await requirePerm("players");
  const playerId = Number(formData.get("playerId"));
  const { data: p } = await supabase
    .from("players")
    .select("has_patch, rank")
    .eq("id", playerId)
    .single();
  const next = !p?.has_patch;
  const patch: Record<string, unknown> = { has_patch: next, patch_at: next ? new Date().toISOString() : null };
  if (next && !p?.rank) patch.rank = "Recruit"; // вхідний ранг з патчем
  await supabase.from("players").update(patch).eq("id", playerId);
  // Видача патча закриває відкритий запит (handed) — щоб у кабінеті не лишалось «на розгляді».
  if (next) {
    await supabase
      .from("patch_requests")
      .update({ status: "handed", decided_at: new Date().toISOString(), decided_by: me.id })
      .eq("player_id", playerId)
      .in("status", ["requested", "approved"]);
  }
  revalidatePath("/admin/players");
  redirect("/admin/players?patch=1");
}

// ── Заявки на патч (право "patch") — двокрокове схвалення, дзеркало бота (patchok/patchno/patchhand) ──
// Окремий запит гравця замість вкладеного embed: patch_requests має ДВА FK на players
// (player_id і decided_by), тож "players(...)" неоднозначний.
async function loadPatchReq(id: number) {
  const { data: req } = await supabase
    .from("patch_requests")
    .select("id, status, player_id")
    .eq("id", id)
    .single();
  if (!req) return null;
  const { data: player } = await supabase
    .from("players")
    .select("id, lang, tg_user_id, rank")
    .eq("id", req.player_id)
    .single();
  return { req, player };
}

// Схвалити заявку (requested → approved). Гравцю — «чекай видачі на грі».
export async function approvePatchRequest(formData: FormData) {
  const me = await requirePerm("patch");
  const id = Number(formData.get("reqId"));
  const loaded = await loadPatchReq(id);
  if (!loaded?.req || loaded.req.status !== "requested") redirect("/admin/patches");
  await supabase
    .from("patch_requests")
    .update({ status: "approved", decided_by: me.id, decided_at: new Date().toISOString() })
    .eq("id", id);
  await notifyPlayerPatch(loaded!.player?.tg_user_id, (loaded!.player?.lang as Lang) ?? "uk", "patch_you_approved");
  revalidatePath("/admin/patches");
  redirect("/admin/patches?done=1");
}

// Відхилити заявку (requested|approved → rejected).
export async function rejectPatchRequest(formData: FormData) {
  const me = await requirePerm("patch");
  const id = Number(formData.get("reqId"));
  const loaded = await loadPatchReq(id);
  if (!loaded?.req || !["requested", "approved"].includes(loaded.req.status)) redirect("/admin/patches");
  await supabase
    .from("patch_requests")
    .update({ status: "rejected", decided_by: me.id, decided_at: new Date().toISOString() })
    .eq("id", id);
  await notifyPlayerPatch(loaded!.player?.tg_user_id, (loaded!.player?.lang as Lang) ?? "uk", "patch_you_rejected");
  revalidatePath("/admin/patches");
  redirect("/admin/patches?done=1");
}

// «Видано на грі» (approved → handed): ставимо патч, вхідний ранг Recruit, дату видачі.
export async function handPatchRequest(formData: FormData) {
  const me = await requirePerm("patch");
  const id = Number(formData.get("reqId"));
  const loaded = await loadPatchReq(id);
  if (!loaded?.req || loaded.req.status !== "approved") redirect("/admin/patches");
  await supabase
    .from("patch_requests")
    .update({ status: "handed", decided_by: me.id, decided_at: new Date().toISOString() })
    .eq("id", id);
  await supabase
    .from("players")
    .update({ has_patch: true, rank: loaded!.player?.rank ?? "Recruit", patch_at: new Date().toISOString() })
    .eq("id", loaded!.req.player_id);
  await notifyPlayerPatch(loaded!.player?.tg_user_id, (loaded!.player?.lang as Lang) ?? "uk", "patch_you_handed");
  revalidatePath("/admin/patches");
  revalidatePath("/cabinet");
  redirect("/admin/patches?done=1");
}

// Налаштування системи патчів (право "patch"). Пише ЛИШЕ патч-ключі — інші toggles не чіпає.
export async function savePatchSettings(formData: FormData) {
  await requirePerm("patch");
  for (const key of PATCH_TOGGLE_KEYS) {
    await setSetting(key, formData.get(key) === "on" ? "true" : "false");
  }
  for (const key of PATCH_VALUE_KEYS) {
    const v = formData.get(key);
    if (v !== null) await setSetting(key, String(v));
  }
  revalidatePath("/admin/patches");
  revalidatePath("/cabinet"); // ціна/текст показуються в кабінеті
  redirect("/admin/patches?saved=1");
}

// Видати гравцю будь-яку ачівку вручну. Переюз канонічної логіки economy.grantAchievement:
// нараховує бали за tier (із множником без патча), пише в point_log, дедуп по (player_id, code).
// Повертає null, якщо ачівка вимкнена / вже є / гонка → показуємо «вже є».
export async function grantPlayerAchievement(formData: FormData) {
  await requirePerm("players");
  const playerId = Number(formData.get("playerId"));
  const code = String(formData.get("achievementCode") ?? "").trim();
  if (!Number.isFinite(playerId) || !code) redirect("/admin/players?err=fields");
  const g = await grantAch(playerId, code);
  revalidatePath("/admin/players");
  redirect(g ? "/admin/players?granted=1" : "/admin/players?err=exists");
}

// Призначити гравця адміном (лише майстер). Далі майстер видає конкретні права в «Ролі адмінів».
export async function makeAdmin(formData: FormData) {
  await requireMaster();
  const playerId = Number(formData.get("playerId"));
  if (!Number.isFinite(playerId)) redirect("/admin/players");
  const { data: target } = await supabase
    .from("players")
    .select("is_master")
    .eq("id", playerId)
    .single();
  if (target?.is_master) redirect("/admin/players"); // майстер і так усе має
  await supabase.from("players").update({ is_admin: true }).eq("id", playerId);
  revalidatePath("/admin/players");
  revalidatePath("/admin/roles");
  redirect("/admin/players?admin=1");
}

// ── Реферали (право referrals) ──
export async function setReferralStatus(formData: FormData) {
  await requirePerm("referrals");
  const refId = Number(formData.get("refId"));
  const status = String(formData.get("status") ?? "");
  if (Number.isFinite(refId) && (status === "confirmed" || status === "rejected")) {
    await supabase
      .from("referrals")
      .update({
        status,
        confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
      })
      .eq("id", refId);
    revalidatePath("/admin/referrals");
  }
  redirect("/admin/referrals?saved=1");
}

// ── Ролі адмінів (майстер) ──
export async function saveRoles(formData: FormData) {
  await requireMaster();
  const playerId = Number(formData.get("playerId"));
  if (!Number.isFinite(playerId)) redirect("/admin/roles");

  const { data: target } = await supabase
    .from("players")
    .select("is_master")
    .eq("id", playerId)
    .single();
  if (target?.is_master) redirect("/admin/roles?err=master"); // майстра не чіпаємо

  const perms = formData.getAll("perms").map(String).filter((p) => ALL_PERMS.includes(p as any));
  await supabase
    .from("players")
    .update({ is_admin: perms.length > 0, admin_perms: perms })
    .eq("id", playerId);
  revalidatePath("/admin/roles");
  redirect("/admin/roles?saved=1");
}

// ── Магазин за бали (майстер) ──
const backShop = (q: string) => redirect(`/admin/shop${q}`);

// Поля товару з форми (спільні для створення і правки).
function parseShopItem(formData: FormData) {
  const costRaw = Number(formData.get("cost"));
  const sortRaw = Number(formData.get("sort"));
  return {
    title_pl: String(formData.get("title_pl") ?? "").trim() || null,
    title_en: String(formData.get("title_en") ?? "").trim() || null,
    title_uk: String(formData.get("title_uk") ?? "").trim() || null,
    desc_pl: String(formData.get("desc_pl") ?? "").trim() || null,
    desc_en: String(formData.get("desc_en") ?? "").trim() || null,
    desc_uk: String(formData.get("desc_uk") ?? "").trim() || null,
    cost: Number.isFinite(costRaw) && costRaw >= 0 ? Math.round(costRaw) : 0,
    sort: Number.isFinite(sortRaw) ? Math.round(sortRaw) : 0,
    active: formData.get("active") === "on",
  };
}

export async function createShopItem(formData: FormData) {
  await requirePerm("shop");
  const item = parseShopItem(formData);
  // Потрібна хоча б одна назва, щоб товар не був безіменним.
  if (!item.title_pl && !item.title_en && !item.title_uk) backShop("?err=fields");
  await supabase.from("shop_items").insert(item);
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  backShop("?created=1");
}

export async function updateShopItem(formData: FormData) {
  await requirePerm("shop");
  const id = Number(formData.get("id"));
  const item = parseShopItem(formData);
  if (!Number.isFinite(id) || (!item.title_pl && !item.title_en && !item.title_uk)) {
    backShop("?err=fields");
  }
  await supabase.from("shop_items").update(item).eq("id", id);
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  backShop("?saved=1");
}

export async function deleteShopItem(formData: FormData) {
  await requirePerm("shop");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) backShop("");
  // purchases.item_id = ON DELETE SET NULL → видалення безпечне, історія лишається.
  await supabase.from("shop_items").delete().eq("id", id);
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  backShop("?deleted=1");
}

// Позначити покупку виданою (журнал покупок).
export async function markFulfilled(formData: FormData) {
  await requirePerm("shop");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) backShop("");
  await supabase
    .from("purchases")
    .update({ fulfilled: true, fulfilled_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/shop");
  backShop("?fulfilled=1");
}

// ── Ачівки (майстер) ──
const backAch = (q: string) => redirect(`/admin/achievements${q}`);

const ACH_TIERS = ["easy", "mid", "hard"];
const ACH_KINDS = ["auto", "manual"];

// Поля ачівки з форми (спільні для створення і правки; без code — він окремо).
function parseAchievement(formData: FormData) {
  const tier = String(formData.get("tier") ?? "mid").trim();
  const kind = String(formData.get("kind") ?? "manual").trim();
  return {
    title_pl: String(formData.get("title_pl") ?? "").trim() || null,
    title_en: String(formData.get("title_en") ?? "").trim() || null,
    title_uk: String(formData.get("title_uk") ?? "").trim() || null,
    description_pl: String(formData.get("description_pl") ?? "").trim() || null,
    description_en: String(formData.get("description_en") ?? "").trim() || null,
    description_uk: String(formData.get("description_uk") ?? "").trim() || null,
    tier: ACH_TIERS.includes(tier) ? tier : "mid",
    kind: ACH_KINDS.includes(kind) ? kind : "manual",
    enabled: formData.get("enabled") === "on",
  };
}

export async function createAchievement(formData: FormData) {
  await requirePerm("achievements");
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const ach = parseAchievement(formData);
  // Код — первинний ключ: лише латиниця/цифри/підкреслення. Назва — хоча б одна.
  if (!/^[a-z0-9_]+$/.test(code) || (!ach.title_pl && !ach.title_en && !ach.title_uk)) {
    backAch("?err=fields");
  }
  // Створені адміном ачівки завжди manual (auto = складна код-логіка, заводиться міграцією).
  const { error } = await supabase.from("achievements").insert({ code, ...ach, kind: "manual" });
  if (error) backAch("?err=dup"); // конфлікт коду (PK)
  revalidatePath("/admin/achievements");
  backAch("?created=1");
}

export async function updateAchievement(formData: FormData) {
  await requirePerm("achievements");
  const code = String(formData.get("code") ?? "").trim();
  const ach = parseAchievement(formData);
  if (!code || (!ach.title_pl && !ach.title_en && !ach.title_uk)) backAch("?err=fields");
  await supabase.from("achievements").update(ach).eq("code", code);
  revalidatePath("/admin/achievements");
  backAch("?saved=1");
}

export async function deleteAchievement(formData: FormData) {
  await requirePerm("achievements");
  const code = String(formData.get("code") ?? "").trim();
  if (!code) backAch("");
  // player_achievements.code → achievements.code (RESTRICT). Якщо ачівку вже
  // здобули — не видаляємо (втратили б історію й бали), а просимо вимкнути.
  const { data: used } = await supabase
    .from("player_achievements")
    .select("id")
    .eq("code", code)
    .limit(1);
  if ((used ?? []).length > 0) backAch("?err=inuse");
  await supabase.from("achievements").delete().eq("code", code);
  revalidatePath("/admin/achievements");
  backAch("?deleted=1");
}

// ── Фото-галерея (право gallery) ──
// Перемикає видимість фото (visible ↔ hidden) без видалення файлу.
export async function toggleGalleryMedia(formData: FormData) {
  await requirePerm("gallery");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) redirect("/admin/gallery");
  const { data } = await supabase
    .from("gallery_media")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  const next = data?.status === "hidden" ? "visible" : "hidden";
  await supabase.from("gallery_media").update({ status: next }).eq("id", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  redirect("/admin/gallery?saved=1");
}

// Повне видалення: прибирає і файл зі Storage, і рядок (механізм «видаліть моє фото»).
export async function deleteGalleryMedia(formData: FormData) {
  await requirePerm("gallery");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) redirect("/admin/gallery");
  const { data } = await supabase
    .from("gallery_media")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (data?.storage_path) {
    const bucket = (await getSetting("gallery_bucket")) || "gallery";
    await supabase.storage.from(bucket).remove([data.storage_path]);
  }
  await supabase.from("gallery_media").delete().eq("id", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  redirect("/admin/gallery?saved=1");
}

// ── Барахолка / Marketplace (право marketplace) — Етап 28 ──
// Веб-альтернатива апруву в адмін-групі. Ті самі статуси, що й колбэки mpok/mpno в боті,
// з guarded-UPDATE (where status='pending') проти гонки подвійного апруву.
const backMp = (q: string) => redirect(`/admin/marketplace${q}`);

async function dmSeller(tgUserId: number | null, key: "mp_you_approved" | "mp_you_rejected") {
  if (!tgUserId) return;
  const sp = await getPlayerByTg(tgUserId);
  try {
    await new Api(process.env.BOT_TOKEN!).sendMessage(tgUserId, tr((sp?.lang as Lang) ?? "uk", key));
  } catch {}
}

export async function approveListing(formData: FormData) {
  const me = await requirePerm("marketplace");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) backMp("");
  const { data } = await supabase
    .from("marketplace_listings")
    .update({ status: "approved", approved_by: me.id, approved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("seller_tg_user_id")
    .maybeSingle();
  if (data) await dmSeller(data.seller_tg_user_id, "mp_you_approved");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  backMp("?saved=1");
}

export async function rejectListing(formData: FormData) {
  await requirePerm("marketplace");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) backMp("");
  const { data } = await supabase
    .from("marketplace_listings")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending")
    .select("storage_paths, seller_tg_user_id")
    .maybeSingle();
  if (data) {
    if (data.storage_paths?.length) {
      const bucket = (await getSetting("marketplace_bucket")) || "marketplace";
      await supabase.storage.from(bucket).remove(data.storage_paths);
    }
    await dmSeller(data.seller_tg_user_id, "mp_you_rejected");
  }
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  backMp("?saved=1");
}

export async function hideListing(formData: FormData) {
  await requirePerm("marketplace");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) backMp("");
  await supabase
    .from("marketplace_listings")
    .update({ status: "hidden" })
    .eq("id", id)
    .eq("status", "approved");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  backMp("?saved=1");
}

export async function unhideListing(formData: FormData) {
  await requirePerm("marketplace");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) backMp("");
  await supabase
    .from("marketplace_listings")
    .update({ status: "approved" })
    .eq("id", id)
    .eq("status", "hidden");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  backMp("?saved=1");
}
