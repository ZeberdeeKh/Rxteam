import { Bot, InlineKeyboard } from "grammy";
import { supabase } from "./supabase";
import { captchaText, correctText, wrongText, expiredText, faq, type Lang } from "./i18n";
import { makeChallenge } from "./captcha";
import { featureEnabled, setSetting } from "./settings";
import { ensurePlayer, setPlayerLang } from "./players";
import { getState, setState, clearState } from "./state";
import { tr } from "./strings";

export const bot = new Bot(process.env.BOT_TOKEN!);

// ─────────────────────────────── Команди ───────────────────────────────

// /start
bot.command("start", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  await ctx.reply(tr(p.lang as Lang, "start"));
});

// /lang — перемкнути мову
bot.command("lang", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const kb = new InlineKeyboard()
    .text("🇵🇱 Polski", "lang:pl")
    .text("🇬🇧 English", "lang:en")
    .text("🇺🇦 Українська", "lang:uk");
  await ctx.reply("🇵🇱 Wybierz język\n🇬🇧 Choose language\n🇺🇦 Обери мову", { reply_markup: kb });
});

// /profile
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

// /rules
bot.command("rules", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  await ctx.reply(faq[p.lang as Lang]);
});

// /admin
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

// /cancel — скинути поточний діалог
bot.command("cancel", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  await clearState(ctx.from!.id);
  const p = await ensurePlayer(ctx.from!);
  await ctx.reply(tr(p.lang as Lang, "cancelled"));
});

// /sethere — зафіксувати топік для анонсів (адмін групи)
bot.command("sethere", async (ctx) => {
  if (ctx.chat.type === "private") {
    await ctx.reply("Виконай цю команду в групі, у топіку «Анонси».");
    return;
  }
  let isChatAdmin = false;
  if (ctx.senderChat?.id === ctx.chat.id) {
    isChatAdmin = true; // анонімний адмін / від імені групи
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

// /addlocation — додати полігон (адмін, у приваті)
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

// /locations — список полігонів (адмін)
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

// ───────────────────────────── Callback queries ─────────────────────────────

// Перемикання мови
bot.callbackQuery(/^lang:(pl|en|uk)$/, async (ctx) => {
  const lang = ctx.match[1] as Lang;
  await ensurePlayer(ctx.from);
  await setPlayerLang(ctx.from.id, lang);
  await ctx.editMessageText(tr(lang, "lang_set"));
  await ctx.answerCallbackQuery();
});

// Радіус локації кнопкою
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

// Відповідь на капчу
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

// Локація на карті — крок loc_pin
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

// Текстовий ввід у діалозі
bot.on("message:text", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return; // невідомі команди ігноруємо
  const { state, data } = await getState(ctx.from!.id);
  if (!state) return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;

  if (state === "loc_name") {
    await setState(ctx.from!.id, "loc_pin", { ...data, name: text });
    await ctx.reply(tr(lang, "loc_ask_pin"));
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
