import { Bot, InlineKeyboard } from "grammy";
import { supabase } from "./supabase";
import { captchaText, correctText, wrongText, expiredText, faqText } from "./i18n";
import { makeChallenge } from "./captcha";

export const bot = new Bot(process.env.BOT_TOKEN!);

// Перемикач функції з таблиці settings (за замовчуванням — увімкнено).
async function featureEnabled(key: string): Promise<boolean> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", `feature_${key}`)
    .maybeSingle();
  if (!data) return true;
  return String(data.value) !== "false";
}

// ── Анти-бот шилд: заявка на вступ → тримовна капча в особисті ──
bot.on("chat_join_request", async (ctx) => {
  const req = ctx.chatJoinRequest;

  // Якщо шилд вимкнено — просто пропускаємо.
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
    // user_chat_id дозволяє написати користувачу до обробки заявки (вікно ~5 хв).
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

  // протерміновано
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

    if (await featureEnabled("onboarding_faq")) {
      try {
        await ctx.api.sendMessage(ch.user_chat_id, faqText);
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
