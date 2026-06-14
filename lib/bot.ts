import { Bot, InlineKeyboard, Keyboard, type Context } from "grammy";
import { supabase } from "./supabase";
import { captchaText, correctText, wrongText, expiredText, faq, type Lang } from "./i18n";
import { makeChallenge } from "./captcha";
import { featureEnabled, setSetting, getSetting, getAllSettings } from "./settings";
import { ensurePlayer, setPlayerLang, getTopPlayers, getPlayerRank } from "./players";
import { awardPoints, getPointValue, getReliability } from "./economy";
import { getState, setState, clearState } from "./state";
import { tr } from "./strings";
import {
  parseDateOnly,
  validTime,
  makeUtc,
  computeWindows,
  buildAnnouncement,
  registeredCount,
  formatWhen,
  distanceMeters,
} from "./games";

export const bot = new Bot(process.env.BOT_TOKEN!);

const REG_BTN = "✅ Записатись / Sign up";

// Право «чек-ін»: майстер або адмін із перміссією checkin.
function canCheckin(p: any): boolean {
  return !!p.is_master || (Array.isArray(p.admin_perms) && p.admin_perms.includes("checkin"));
}

// ─────────────────────────────── Команди ───────────────────────────────

bot.command("start", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const payload = typeof ctx.match === "string" ? ctx.match : "";
  const m = payload.match(/^g(\d+)$/);
  if (m) {
    await showGameCard(ctx, p, Number(m[1]));
    return;
  }
  await ctx.reply(tr(p.lang as Lang, "start"));
});

bot.command("lang", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const kb = new InlineKeyboard()
    .text("🇵🇱 Polski", "lang:pl")
    .text("🇬🇧 English", "lang:en")
    .text("🇺🇦 Українська", "lang:uk");
  await ctx.reply("🇵🇱 Wybierz język\n🇬🇧 Choose language\n🇺🇦 Обери мову", { reply_markup: kb });
});

bot.command("profile", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  const rel = await getReliability(p.id);
  const rankStr = p.has_patch ? (p.rank ?? "Recruit") : tr(lang, "no_patch_label");
  let msg = tr(lang, "profile", {
    name: p.name ?? "—",
    callsign: p.callsign ?? tr(lang, "callsign_unset"),
    tg: p.tg_username ? "@" + p.tg_username : "—",
    rank: rankStr,
    games: p.games_played ?? 0,
    earned: p.points_earned ?? 0,
    balance: p.points_balance ?? 0,
    reliability: rel.pct === null ? "—" : `${rel.pct}%`,
  });
  if (p.is_master) msg += "\n" + tr(lang, "badge_master");
  else if (p.is_admin) msg += "\n" + tr(lang, "badge_admin");
  await ctx.reply(msg);
});

bot.command("rules", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  await ctx.reply(faq[p.lang as Lang]);
});

bot.command("top", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  const top = await getTopPlayers(10);
  let msg = tr(lang, "top_title");
  if (!top.length) {
    msg += "\n\n" + tr(lang, "top_empty");
  } else {
    const medals = ["🥇", "🥈", "🥉"];
    msg +=
      "\n\n" +
      top
        .map((pl, i) =>
          tr(lang, "top_line", {
            place: medals[i] ?? `${i + 1}.`,
            who: pl.callsign ?? pl.name ?? "—",
            earned: pl.points_earned ?? 0,
            games: pl.games_played ?? 0,
          }),
        )
        .join("\n");
  }
  const myPlace = await getPlayerRank(p.points_earned ?? 0);
  msg +=
    "\n\n" +
    tr(lang, "top_me", {
      place: myPlace,
      earned: p.points_earned ?? 0,
      games: p.games_played ?? 0,
    });
  await ctx.reply(msg);
});

bot.command("admin", async (ctx) => {
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!p.is_admin) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  const perms = p.is_master ? "master" : p.admin_perms?.length ? p.admin_perms.join(", ") : "—";
  await ctx.reply(tr(lang, "admin_panel", { perms }));
});

bot.command("cancel", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  await clearState(ctx.from!.id);
  const p = await ensurePlayer(ctx.from!);
  await ctx.reply(tr(p.lang as Lang, "cancelled"));
});

bot.command("sethere", async (ctx) => {
  if (ctx.chat.type === "private") {
    await ctx.reply("Виконай цю команду в групі, у топіку «Анонси».");
    return;
  }
  let isChatAdmin = false;
  if (ctx.senderChat?.id === ctx.chat.id) {
    isChatAdmin = true;
  } else if (ctx.from) {
    try {
      const m = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
      isChatAdmin = m.status === "creator" || m.status === "administrator";
    } catch (e) {
      console.error("getChatMember failed", e);
    }
  }
  if (!isChatAdmin) {
    await ctx.reply("⛔ Лише для адмінів групи.");
    return;
  }
  await setSetting("announce_chat_id", String(ctx.chat.id));
  await setSetting(
    "announce_thread_id",
    ctx.message?.message_thread_id ? String(ctx.message.message_thread_id) : "",
  );
  await ctx.reply("✅ Топік для анонсів збережено. Сюди йтимуть анонси ігор.");
});

bot.command("addlocation", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!p.is_admin) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  await setState(ctx.from!.id, "loc_name", {});
  await ctx.reply(tr(lang, "loc_ask_name"));
});

bot.command("locations", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!p.is_admin) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  const { data } = await supabase.from("locations").select("*").order("id");
  if (!data?.length) {
    await ctx.reply(tr(lang, "locations_empty"));
    return;
  }
  const list = data.map((l) => `#${l.id} — ${l.name} (${l.radius_m} м)`).join("\n");
  await ctx.reply(tr(lang, "locations_title") + "\n" + list);
});

bot.command("newgame", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!p.is_admin) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  const { data: locs } = await supabase.from("locations").select("*").order("id");
  if (!locs?.length) {
    await ctx.reply(tr(lang, "gamenew_no_loc"));
    return;
  }
  const kb = new InlineKeyboard();
  locs.forEach((l, i) => {
    kb.text(l.name, `gameloc:${l.id}`);
    if (i % 2 === 1) kb.row();
  });
  await setState(ctx.from!.id, "game_loc", {});
  await ctx.reply(tr(lang, "gamenew_pick_loc"), { reply_markup: kb });
});

bot.command("checkin", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  const { data: regs } = await supabase
    .from("registrations")
    .select("game_id, games(*)")
    .eq("player_id", p.id)
    .eq("status", "registered");
  const now = Date.now();
  const active = (regs ?? [])
    .map((r) => (r as any).games)
    .filter(
      (g) =>
        g &&
        g.checkin_from &&
        g.checkin_to &&
        new Date(g.checkin_from).getTime() <= now &&
        now <= new Date(g.checkin_to).getTime(),
    );
  if (!active.length) {
    await ctx.reply(tr(lang, "checkin_none"));
    return;
  }
  if (active.length === 1) {
    await promptCheckin(ctx, lang, active[0].id);
    return;
  }
  const kb = new InlineKeyboard();
  active.forEach((g) => kb.text(g.title ?? `#${g.id}`, `checkin:${g.id}`).row());
  await ctx.reply(tr(lang, "checkin_pick"), { reply_markup: kb });
});

bot.callbackQuery(/^checkin:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  await promptCheckin(ctx, p.lang as Lang, Number(ctx.match[1]));
});

// ── Ручний чек-ін адміном (право checkin): відмітити гравця без геолокації ──
bot.command("markcheckin", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!canCheckin(p)) {
    await ctx.reply(tr(lang, "mc_no_perm"));
    return;
  }
  const { data: games } = await supabase
    .from("games")
    .select("id, title, start_at")
    .order("start_at", { ascending: false })
    .limit(8);
  if (!games?.length) {
    await ctx.reply(tr(lang, "mc_no_games"));
    return;
  }
  const kb = new InlineKeyboard();
  games.forEach((g) =>
    kb.text(`${g.title ?? "#" + g.id} — ${formatWhen(g.start_at)}`, `acheckin:${g.id}`).row(),
  );
  await ctx.reply(tr(lang, "mc_pick_game"), { reply_markup: kb });
});

bot.callbackQuery(/^acheckin:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  if (!canCheckin(p)) return;
  const gameId = Number(ctx.match[1]);
  const { data: regs } = await supabase
    .from("registrations")
    .select("player_id, status, players(id, callsign, name)")
    .eq("game_id", gameId)
    .in("status", ["registered", "no_show"]);
  const { data: checked } = await supabase
    .from("checkins")
    .select("player_id")
    .eq("game_id", gameId);
  const checkedSet = new Set((checked ?? []).map((c) => c.player_id));
  const avail = (regs ?? []).filter((r) => !checkedSet.has(r.player_id));
  if (!avail.length) {
    await ctx.editMessageText(tr(lang, "mc_no_players"));
    return;
  }
  const kb = new InlineKeyboard();
  avail.forEach((r) => {
    const pl = (r as any).players;
    const who = pl?.callsign ?? pl?.name ?? `#${r.player_id}`;
    kb.text(who, `acheckp:${gameId}:${r.player_id}`).row();
  });
  await ctx.editMessageText(tr(lang, "mc_pick_player"), { reply_markup: kb });
});

bot.callbackQuery(/^acheckp:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  if (!canCheckin(p)) return;
  const gameId = Number(ctx.match[1]);
  const playerId = Number(ctx.match[2]);
  const { data: target } = await supabase
    .from("players")
    .select("id, callsign, name, games_played")
    .eq("id", playerId)
    .single();
  const who = target?.callsign ?? target?.name ?? `#${playerId}`;
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .maybeSingle();
  if (existing) {
    await ctx.editMessageText(tr(lang, "mc_already", { who }));
    return;
  }
  await supabase
    .from("checkins")
    .insert({ game_id: gameId, player_id: playerId, is_manual: true, source: "manual" });
  await supabase
    .from("players")
    .update({ games_played: (target?.games_played ?? 0) + 1 })
    .eq("id", playerId);
  await awardPoints({
    playerId,
    reason: "attend",
    baseDelta: await getPointValue("pts_attend", 10),
    gameId,
  });
  // Якщо гравця вже позначили як неявку — повертаємо в registered.
  await supabase
    .from("registrations")
    .update({ status: "registered" })
    .eq("game_id", gameId)
    .eq("player_id", playerId);
  await ctx.editMessageText(tr(lang, "mc_done", { who }));
});

// ───────────────────────────── Callback queries ─────────────────────────────

bot.callbackQuery(/^lang:(pl|en|uk)$/, async (ctx) => {
  const lang = ctx.match[1] as Lang;
  await ensurePlayer(ctx.from);
  await setPlayerLang(ctx.from.id, lang);
  await ctx.editMessageText(tr(lang, "lang_set"));
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^locrad:(\d+)$/, async (ctx) => {
  const radius = Number(ctx.match[1]);
  const { state, data } = await getState(ctx.from.id);
  if (state !== "loc_radius") {
    await ctx.answerCallbackQuery();
    return;
  }
  const p = await ensurePlayer(ctx.from);
  await finalizeLocation(ctx.from.id, data, radius);
  await ctx.editMessageText(tr(p.lang as Lang, "loc_saved", { name: data.name, radius }));
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^gameloc:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const locId = Number(ctx.match[1]);
  const { state, data } = await getState(ctx.from.id);
  if (state !== "game_loc") return;
  const p = await ensurePlayer(ctx.from);
  await setState(ctx.from.id, "game_date", { ...data, locationId: locId });
  await ctx.editMessageText(tr(p.lang as Lang, "gamenew_date"));
});

bot.callbackQuery(/^gamecap:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const cap = Number(ctx.match[1]);
  const { state, data } = await getState(ctx.from.id);
  if (state !== "game_cap") return;
  const p = await ensurePlayer(ctx.from);
  await finalizeGame(ctx, p.lang as Lang, { ...data, capacity: cap === 0 ? null : cap });
});

bot.callbackQuery(/^reg:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const gameId = Number(ctx.match[1]);
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!game || game.status !== "announced") {
    await ctx.reply(tr(lang, "game_not_found"));
    return;
  }
  if (game.reg_closes_at && new Date(game.reg_closes_at).getTime() < Date.now()) {
    await ctx.reply(tr(lang, "reg_closed"));
    return;
  }
  const { data: existing } = await supabase
    .from("registrations")
    .select("status")
    .eq("game_id", gameId)
    .eq("player_id", p.id)
    .maybeSingle();
  if (existing?.status === "registered") {
    await ctx.reply(tr(lang, "already_reg"));
    return;
  }
  if (game.capacity && (await registeredCount(gameId)) >= game.capacity) {
    await ctx.reply(tr(lang, "game_full"));
    return;
  }
  if (!p.callsign) {
    await setState(ctx.from.id, "reg_callsign", { gameId });
    await ctx.reply(tr(lang, "ask_callsign"));
    return;
  }
  await startRegFlow(ctx, lang, gameId);
});

bot.callbackQuery(/^regrent:(yes|no)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_rental") return;
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  await setState(ctx.from.id, "reg_transport", { ...data, needsRental: ctx.match[1] === "yes" });
  const kb = new InlineKeyboard()
    .text(tr(lang, "btn_transport_own"), "regtr:own")
    .row()
    .text(tr(lang, "btn_transport_need"), "regtr:need");
  await ctx.editMessageText(tr(lang, "reg_transport_q"), { reply_markup: kb });
});

bot.callbackQuery(/^regtr:(own|need)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_transport") return;
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  if (ctx.match[1] === "need") {
    await ctx.editMessageText(tr(lang, "transport_need_noted"));
    await finalizeReg(ctx, p, { ...data, transport: "need" });
    return;
  }
  await setState(ctx.from.id, "reg_from", { ...data, transport: "own" });
  await ctx.editMessageText(tr(lang, "reg_from_q"));
});

bot.callbackQuery(/^regseats:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_seats") return;
  const p = await ensurePlayer(ctx.from);
  await finalizeReg(ctx, p, { ...data, freeSeats: Number(ctx.match[1]) });
});

bot.callbackQuery(/^unreg:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const gameId = Number(ctx.match[1]);
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!game) {
    await ctx.reply(tr(lang, "game_not_found"));
    return;
  }
  if (game.cancel_deadline && new Date(game.cancel_deadline).getTime() < Date.now()) {
    await ctx.reply(tr(lang, "cancel_locked"));
    return;
  }
  await supabase
    .from("registrations")
    .update({ status: "cancelled" })
    .eq("game_id", gameId)
    .eq("player_id", p.id);
  await updateAnnouncement(gameId);
  await ctx.reply(tr(lang, "unreg_done"));
});

// ─────────────────────────────── Анти-бот шилд ───────────────────────────────

bot.on("chat_join_request", async (ctx) => {
  const req = ctx.chatJoinRequest;

  if (!(await featureEnabled("shield"))) {
    try {
      await ctx.api.approveChatJoinRequest(req.chat.id, req.from.id);
    } catch (e) {
      console.error("approve (shield off) failed", e);
    }
    return;
  }

  const { a, b, answer, options } = makeChallenge();
  const expiresAt = new Date(Date.now() + 4 * 60 * 1000).toISOString();

  await supabase.from("join_challenges").upsert(
    {
      chat_id: req.chat.id,
      user_id: req.from.id,
      user_chat_id: req.user_chat_id,
      answer,
      status: "pending",
      expires_at: expiresAt,
    },
    { onConflict: "chat_id,user_id" },
  );

  const kb = new InlineKeyboard();
  options.forEach((o) => kb.text(String(o), `cap:${o}`));

  try {
    await ctx.api.sendMessage(req.user_chat_id, captchaText(a, b), { reply_markup: kb });
  } catch (e) {
    console.error("captcha DM failed (user privacy?)", e);
  }
});

bot.callbackQuery(/^cap:(-?\d+)$/, async (ctx) => {
  const chosen = Number(ctx.match[1]);
  const userId = ctx.from.id;

  const { data: ch } = await supabase
    .from("join_challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ch) {
    await ctx.answerCallbackQuery();
    return;
  }

  if (new Date(ch.expires_at).getTime() < Date.now()) {
    await supabase.from("join_challenges").update({ status: "expired" }).eq("id", ch.id);
    await ctx.editMessageText(expiredText);
    try {
      await ctx.api.declineChatJoinRequest(ch.chat_id, userId);
    } catch {}
    await ctx.answerCallbackQuery();
    return;
  }

  if (chosen === ch.answer) {
    try {
      await ctx.api.approveChatJoinRequest(ch.chat_id, userId);
    } catch (e) {
      console.error("approve failed", e);
    }
    await supabase.from("join_challenges").update({ status: "passed" }).eq("id", ch.id);
    await ctx.editMessageText(correctText);

    const p = await ensurePlayer(ctx.from);
    if (await featureEnabled("onboarding_faq")) {
      try {
        await ctx.api.sendMessage(ch.user_chat_id, faq[p.lang as Lang]);
      } catch {}
    }
  } else {
    try {
      await ctx.api.declineChatJoinRequest(ch.chat_id, userId);
    } catch {}
    await supabase.from("join_challenges").update({ status: "failed" }).eq("id", ch.id);
    await ctx.editMessageText(wrongText);
  }

  await ctx.answerCallbackQuery();
});

// ─────────────────────── Диспетчер покрокових діалогів ───────────────────────

bot.on("message:location", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const { state, data } = await getState(ctx.from!.id);
  if (state !== "loc_pin" && state !== "checkin") return;
  const p = await ensurePlayer(ctx.from!);
  const loc = ctx.message.location;

  if (state === "loc_pin") {
    await setState(ctx.from!.id, "loc_radius", { ...data, lat: loc.latitude, lng: loc.longitude });
    const kb = new InlineKeyboard()
      .text("200 м", "locrad:200")
      .text("300 м", "locrad:300")
      .text("500 м", "locrad:500");
    await ctx.reply(tr(p.lang as Lang, "loc_ask_radius"), { reply_markup: kb });
    return;
  }

  await handleCheckin(ctx, p, data.gameId, loc.latitude, loc.longitude);
});

bot.on("message:text", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return;
  const { state, data } = await getState(ctx.from!.id);
  if (!state) return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;

  // ── локація ──
  if (state === "loc_name") {
    await setState(ctx.from!.id, "loc_pin", { ...data, name: text });
    await ctx.reply(tr(lang, "loc_ask_pin"));
    return;
  }
  if (state === "loc_pin") {
    const m = text.match(/(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)/);
    const lat = m ? parseFloat(m[1].replace(",", ".")) : NaN;
    const lng = m ? parseFloat(m[2].replace(",", ".")) : NaN;
    if (!m || isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      await ctx.reply(tr(lang, "loc_bad_pin"));
      return;
    }
    await setState(ctx.from!.id, "loc_radius", { ...data, lat, lng });
    const kb = new InlineKeyboard()
      .text("200 м", "locrad:200")
      .text("300 м", "locrad:300")
      .text("500 м", "locrad:500");
    await ctx.reply(tr(lang, "loc_ask_radius"), { reply_markup: kb });
    return;
  }
  if (state === "loc_radius") {
    const radius = parseInt(text, 10);
    if (!radius || radius < 20 || radius > 5000) {
      await ctx.reply(tr(lang, "loc_bad_radius"));
      return;
    }
    await finalizeLocation(ctx.from!.id, data, radius);
    await ctx.reply(tr(lang, "loc_saved", { name: data.name, radius }));
    return;
  }

  // ── створення гри ──
  if (state === "game_date") {
    const date = parseDateOnly(text);
    if (!date) {
      await ctx.reply(tr(lang, "gamenew_bad_date"));
      return;
    }
    await setState(ctx.from!.id, "game_gather", { ...data, date });
    await ctx.reply(tr(lang, "gamenew_gather"));
    return;
  }
  if (state === "game_gather") {
    const t = validTime(text);
    if (!t) {
      await ctx.reply(tr(lang, "gamenew_bad_time"));
      return;
    }
    await setState(ctx.from!.id, "game_start", { ...data, gather: t });
    await ctx.reply(tr(lang, "gamenew_start"));
    return;
  }
  if (state === "game_start") {
    const t = validTime(text);
    if (!t) {
      await ctx.reply(tr(lang, "gamenew_bad_time"));
      return;
    }
    await setState(ctx.from!.id, "game_title", { ...data, start: t });
    await ctx.reply(tr(lang, "gamenew_title"));
    return;
  }
  if (state === "game_title") {
    await setState(ctx.from!.id, "game_scn_pl", { ...data, title: text });
    await ctx.reply(tr(lang, "gamenew_scn_pl"));
    return;
  }
  if (state === "game_scn_pl") {
    await setState(ctx.from!.id, "game_scn_uk", { ...data, scenarioPl: text });
    await ctx.reply(tr(lang, "gamenew_scn_uk"));
    return;
  }
  if (state === "game_scn_uk") {
    await setState(ctx.from!.id, "game_cap", { ...data, scenarioUk: text });
    const kb = new InlineKeyboard().text(tr(lang, "gamenew_nolimit"), "gamecap:0");
    await ctx.reply(tr(lang, "gamenew_cap"), { reply_markup: kb });
    return;
  }
  if (state === "game_cap") {
    const cap = parseInt(text, 10);
    if (!cap || cap < 1) {
      await ctx.reply(tr(lang, "gamenew_cap"));
      return;
    }
    await finalizeGame(ctx, lang, { ...data, capacity: cap });
    return;
  }

  // ── реєстрація: позивний ──
  if (state === "reg_callsign") {
    const callsign = text;
    const { data: taken } = await supabase
      .from("players")
      .select("id")
      .eq("callsign", callsign)
      .maybeSingle();
    if (taken && taken.id !== p.id) {
      await ctx.reply(tr(lang, "callsign_taken"));
      return;
    }
    await supabase.from("players").update({ callsign }).eq("id", p.id);
    await startRegFlow(ctx, lang, data.gameId);
    return;
  }
  if (state === "reg_from") {
    await setState(ctx.from!.id, "reg_seats", { ...data, fromPlace: text });
    const kb = new InlineKeyboard()
      .text("0", "regseats:0")
      .text("1", "regseats:1")
      .text("2", "regseats:2")
      .text("3", "regseats:3");
    await ctx.reply(tr(lang, "reg_seats_q"), { reply_markup: kb });
    return;
  }
  if (state === "reg_seats") {
    const seats = parseInt(text, 10);
    if (isNaN(seats) || seats < 0 || seats > 20) {
      await ctx.reply(tr(lang, "reg_seats_q"));
      return;
    }
    await finalizeReg(ctx, p, { ...data, freeSeats: seats });
    return;
  }
});

// ─────────────────────────────── Хелпери ───────────────────────────────

async function finalizeLocation(tgId: number, data: Record<string, any>, radius: number) {
  await supabase.from("locations").insert({
    name: data.name,
    lat: data.lat,
    lng: data.lng,
    radius_m: radius,
    map_url: `https://maps.google.com/?q=${data.lat},${data.lng}`,
  });
  await clearState(tgId);
}

async function promptCheckin(ctx: Context, lang: Lang, gameId: number) {
  await setState(ctx.from!.id, "checkin", { gameId });
  const kb = new Keyboard().requestLocation(tr(lang, "checkin_btn")).resized().oneTime();
  await ctx.reply(tr(lang, "checkin_prompt"), { reply_markup: kb });
}

async function handleCheckin(ctx: Context, p: any, gameId: number, lat: number, lng: number) {
  const lang = p.lang as Lang;
  const { data: game } = await supabase
    .from("games")
    .select("*, locations(*)")
    .eq("id", gameId)
    .single();
  const now = Date.now();
  if (
    !game ||
    !game.checkin_from ||
    !game.checkin_to ||
    now < new Date(game.checkin_from).getTime() ||
    now > new Date(game.checkin_to).getTime()
  ) {
    await clearState(ctx.from!.id);
    await ctx.reply(tr(lang, "checkin_window_closed"), { reply_markup: { remove_keyboard: true } });
    return;
  }
  const gl = (game as any).locations;
  const dist = Math.round(distanceMeters(lat, lng, gl.lat, gl.lng));
  if (dist > gl.radius_m) {
    await ctx.reply(tr(lang, "checkin_too_far", { dist, radius: gl.radius_m }));
    return; // лишаємо стан — можна спробувати ще раз
  }
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("game_id", gameId)
    .eq("player_id", p.id)
    .maybeSingle();
  if (existing) {
    await clearState(ctx.from!.id);
    await ctx.reply(tr(lang, "checkin_already"), { reply_markup: { remove_keyboard: true } });
    return;
  }
  await supabase
    .from("checkins")
    .insert({ game_id: gameId, player_id: p.id, lat, lng, distance_m: dist, source: "tg" });
  await supabase
    .from("players")
    .update({ games_played: (p.games_played ?? 0) + 1 })
    .eq("id", p.id);
  await awardPoints({
    playerId: p.id,
    reason: "attend",
    baseDelta: await getPointValue("pts_attend", 10),
    gameId,
    hasPatch: !!p.has_patch,
  });
  await clearState(ctx.from!.id);
  await ctx.reply(tr(lang, "checkin_done"), { reply_markup: { remove_keyboard: true } });
}

async function finalizeGame(ctx: Context, lang: Lang, data: Record<string, any>) {
  const chatId = await getSetting("announce_chat_id");
  if (!chatId) {
    await clearState(ctx.from!.id);
    await ctx.reply(tr(lang, "gamenew_no_topic"));
    return;
  }
  const threadId = await getSetting("announce_thread_id");
  const gatherUtc = makeUtc(data.date, data.gather);
  const startUtc = makeUtc(data.date, data.start);
  const w = computeWindows(gatherUtc, startUtc);
  const capacity: number | null = data.capacity ?? null;

  const { data: loc } = await supabase
    .from("locations")
    .select("*")
    .eq("id", data.locationId)
    .single();

  const { data: game } = await supabase
    .from("games")
    .insert({
      location_id: data.locationId,
      title: data.title,
      scenario_pl: data.scenarioPl,
      scenario_uk: data.scenarioUk,
      gather_at: gatherUtc,
      start_at: startUtc,
      reg_closes_at: w.reg_closes_at,
      cancel_deadline: w.cancel_deadline,
      checkin_from: w.checkin_from,
      checkin_to: w.checkin_to,
      capacity,
      status: "announced",
    })
    .select("*")
    .single();

  const settings = await getAllSettings();
  const text = buildAnnouncement(
    {
      title: data.title,
      lat: loc!.lat,
      lng: loc!.lng,
      mapUrl: loc!.map_url,
      gatherUtc,
      startUtc,
      scenarioPl: data.scenarioPl,
      scenarioUk: data.scenarioUk,
      count: 0,
      capacity,
    },
    settings,
  );
  const kb = new InlineKeyboard().url(REG_BTN, `https://t.me/${ctx.me.username}?start=g${game!.id}`);

  await clearState(ctx.from!.id);
  try {
    const msg = await ctx.api.sendMessage(Number(chatId), text, {
      reply_markup: kb,
      ...(threadId ? { message_thread_id: Number(threadId) } : {}),
    });
    await supabase
      .from("games")
      .update({
        announce_chat_id: Number(chatId),
        announce_thread_id: threadId ? Number(threadId) : null,
        announce_message_id: msg.message_id,
      })
      .eq("id", game!.id);
  } catch (e) {
    console.error("announcement post failed", e);
    await ctx.reply("⚠️ Гру створено, але анонс не запостився (можливо, текст задовгий або немає прав у топіку).");
    return;
  }

  await ctx.reply(
    tr(lang, "gamenew_done", {
      id: game!.id,
      when: formatWhen(gatherUtc),
      regclose: formatWhen(w.reg_closes_at),
    }),
  );
}

async function updateAnnouncement(gameId: number) {
  const { data: game } = await supabase
    .from("games")
    .select("*, locations(*)")
    .eq("id", gameId)
    .single();
  if (!game?.announce_chat_id || !game.announce_message_id) return;
  const loc = (game as any).locations;
  const count = await registeredCount(gameId);
  const settings = await getAllSettings();
  const text = buildAnnouncement(
    {
      title: game.title,
      lat: loc.lat,
      lng: loc.lng,
      mapUrl: loc.map_url,
      gatherUtc: game.gather_at ?? game.start_at,
      startUtc: game.start_at,
      scenarioPl: game.scenario_pl,
      scenarioUk: game.scenario_uk,
      count,
      capacity: game.capacity,
    },
    settings,
  );
  const kb = new InlineKeyboard().url(
    REG_BTN,
    `https://t.me/${bot.botInfo.username}?start=g${gameId}`,
  );
  try {
    await bot.api.editMessageText(game.announce_chat_id, game.announce_message_id, text, {
      reply_markup: kb,
    });
  } catch (e) {
    console.error("update announcement failed", e);
  }
}

async function showGameCard(ctx: Context, p: any, gameId: number) {
  const lang = p.lang as Lang;
  const { data: game } = await supabase
    .from("games")
    .select("*, locations(*)")
    .eq("id", gameId)
    .single();
  if (!game) {
    await ctx.reply(tr(lang, "game_not_found"));
    return;
  }
  const loc = (game as any).locations;
  const count = await registeredCount(gameId);
  const { data: reg } = await supabase
    .from("registrations")
    .select("status")
    .eq("game_id", gameId)
    .eq("player_id", p.id)
    .maybeSingle();
  const kb = new InlineKeyboard();
  if (reg?.status === "registered") kb.text(tr(lang, "btn_leave"), `unreg:${gameId}`);
  else kb.text(tr(lang, "btn_register"), `reg:${gameId}`);
  await ctx.reply(
    tr(lang, "game_card", {
      title: game.title ?? "ASG",
      when: formatWhen(game.gather_at ?? game.start_at),
      loc: loc?.name ?? "—",
      count,
    }),
    { reply_markup: kb },
  );
}

async function startRegFlow(ctx: Context, lang: Lang, gameId: number) {
  await setState(ctx.from!.id, "reg_rental", { gameId });
  const kb = new InlineKeyboard()
    .text(tr(lang, "btn_yes"), "regrent:yes")
    .text(tr(lang, "btn_no"), "regrent:no");
  await ctx.reply(tr(lang, "reg_rental_q"), { reply_markup: kb });
}

async function finalizeReg(ctx: Context, p: any, data: Record<string, any>) {
  const gameId = data.gameId;
  await supabase.from("registrations").upsert(
    {
      game_id: gameId,
      player_id: p.id,
      status: "registered",
      needs_rental: !!data.needsRental,
      transport: data.transport ?? null,
      from_place: data.fromPlace ?? null,
      free_seats: data.freeSeats ?? null,
      seats_closed: false,
    },
    { onConflict: "game_id,player_id" },
  );
  await clearState(ctx.from!.id);
  await updateAnnouncement(gameId);
  const { data: game } = await supabase
    .from("games")
    .select("*, locations(*)")
    .eq("id", gameId)
    .single();
  const loc = (game as any)?.locations;
  await ctx.reply(
    tr(p.lang as Lang, "reg_done", {
      loc: loc?.name ?? "",
      when: game ? formatWhen(game.gather_at ?? game.start_at) : "",
    }),
  );
  if (data.needsRental) {
    await ctx.reply(tr(p.lang as Lang, "rental_noted"));
    await notifyAdminsRental(p, game);
  }
}

async function notifyAdminsRental(p: any, game: any) {
  const { data: admins } = await supabase
    .from("players")
    .select("tg_user_id, lang")
    .eq("is_admin", true);
  const when = game ? formatWhen(game.gather_at ?? game.start_at) : "";
  for (const a of admins ?? []) {
    if (!a.tg_user_id) continue;
    const text = tr((a.lang as Lang) ?? "uk", "admin_rental_notify", {
      callsign: p.callsign ?? p.name ?? "?",
      title: game?.title ?? "ASG",
      when,
    });
    try {
      await bot.api.sendMessage(a.tg_user_id, text);
    } catch {}
  }
}
