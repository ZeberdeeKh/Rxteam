import { Bot, InlineKeyboard } from "grammy";
import { supabase } from "./supabase";
import { captchaText, correctText, wrongText, expiredText, faq, type Lang } from "./i18n";
import { makeChallenge } from "./captcha";
import { featureEnabled, setSetting } from "./settings";
import { ensurePlayer, setPlayerLang } from "./players";
import { tr } from "./strings";

export const bot = new Bot(process.env.BOT_TOKEN!);

// ── /start ──
bot.command("start", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  await ctx.reply(tr(p.lang as Lang, "start"));
});

// ── /lang — перемкнути мову ──
bot.command("lang", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const kb = new InlineKeyboard()
    .text("🇵🇱 Polski", "lang:pl")
    .text("🇬🇧 English", "lang:en")
    .text("🇺🇦 Українська", "lang:uk");
  await ctx.reply("🇵🇱 Wybierz język\n🇬🇧 Choose language\n🇺🇦 Обери мову", { reply_markup: kb });
});

bot.callbackQuery(/^lang:(pl|en|uk)$/, async (ctx) => {
  const lang = ctx.match[1] as Lang;
  await ensurePlayer(ctx.from);
  await setPlayerLang(ctx.from.id, lang);
  await ctx.editMessageText(tr(lang, "lang_set"));
  await ctx.answerCallbackQuery();
});

// ── /profile ──
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

// ── /rules — правила мовою гравця ──
bot.command("rules", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  await ctx.reply(faq[p.lang as Lang]);
});

// ── /admin — статус прав ──
bot.command("admin", async (ctx) => {
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!p.is_admin) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  const perms = p.is_master
    ? "master"
    : p.admin_perms?.length
      ? p.admin_perms.join(", ")
      : "—";
  await ctx.reply(tr(lang, "admin_panel", { perms }));
});

// ── /sethere — зафіксувати топік для анонсів (адмін, у групі) ──
bot.command("sethere", async (ctx) => {
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!p.is_admin) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  if (ctx.chat.type === "private") {
    await ctx.reply(tr(lang, "sethere_group_only"));
    return;
  }
  await setSetting("announce_chat_id", String(ctx.chat.id));
  await setSetting(
    "announce_thread_id",
    ctx.message?.message_thread_id ? String(ctx.message.message_thread_id) : "",
  );
  await ctx.reply(tr(lang, "sethere_ok"));
});

// ── Анти-бот шилд: заявка на вступ → тримовна капча в особисті ──
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

// ── Відповідь на капчу ──
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

    // Створюємо профіль гравця + онбординг його мовою.
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
