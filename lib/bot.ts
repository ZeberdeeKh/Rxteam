import { Bot, InlineKeyboard, type Context } from "grammy";
import { supabase } from "./supabase";
import { captchaText, correctText, wrongText, expiredText, faq, type Lang } from "./i18n";
import { makeChallenge } from "./captcha";
import { featureEnabled, setSetting, getSetting, getAllSettings } from "./settings";
import { ensurePlayer, setPlayerLang } from "./players";
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
} from "./games";

export const bot = new Bot(process.env.BOT_TOKEN!);

const REG_BTN = "✅ Записатись / Sign up";

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
  let msg = tr(lang, "profile", {
    name: p.name ?? "—",
    callsign: p.callsign ?? tr(lang, "callsign_unset"),
    tg: p.tg_username ? "@" + p.tg_username : "—",
    games: p.games_played ?? 0,
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
  await finalizeRegistration(ctx, p, gameId);
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
  if (state !== "loc_pin") return;
  const p = await ensurePlayer(ctx.from!);
  const loc = ctx.message.location;
  await setState(ctx.from!.id, "loc_radius", { ...data, lat: loc.latitude, lng: loc.longitude });
  const kb = new InlineKeyboard()
    .text("200 м", "locrad:200")
    .text("300 м", "locrad:300")
    .text("500 м", "locrad:500");
  await ctx.reply(tr(p.lang as Lang, "loc_ask_radius"), { reply_markup: kb });
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
    await clearState(ctx.from!.id);
    await finalizeRegistration(ctx, { ...p, callsign }, data.gameId);
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

async function finalizeRegistration(ctx: Context, p: any, gameId: number) {
  await supabase
    .from("registrations")
    .upsert({ game_id: gameId, player_id: p.id, status: "registered" }, { onConflict: "game_id,player_id" });
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
}
