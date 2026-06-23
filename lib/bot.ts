import { Bot, InlineKeyboard, Keyboard, type Context } from "grammy";
import { supabase } from "./supabase";
import { type Lang } from "./i18n";
import { playerCommands } from "./bot-commands";
import {
  buildCaptchaText,
  buildCorrectText,
  buildWrongText,
  buildExpiredText,
  getFaqText,
} from "./bot-texts";
import { recordMemberSeen, recordMemberLeft, hasEverLeft } from "./members";
import { makeChallenge } from "./captcha";
import { normalizeCallsign } from "./validation";
import { featureEnabled, setSetting, getSetting, getAllSettings } from "./settings";
import {
  ensurePlayer,
  setPlayerLang,
  getTopPlayers,
  getPlayerRank,
  getAdminsWithPerm,
  getPlayerByTg,
} from "./players";
import {
  awardPoints,
  getPointValue,
  getReliability,
  nextRank,
  RANK_COST_KEY,
  RANK_COST_FALLBACK,
  CALLSIGN_CHANGE_COST_KEY,
  CALLSIGN_CHANGE_COST_FALLBACK,
  callsignChangeIsFree,
  grantCheckinAchievements,
  grantAchievement,
} from "./economy";
import { getState, setState, clearState } from "./state";
import { tr, POLL_QUESTION, pollWinnerText, lotteryWinnerText } from "./strings";
import { currentQuarter, prevQuarter } from "./season";
import { createLinkCode } from "./identities";
import { confirmReferralCore } from "./referrals";
import {
  parseDateOnly,
  validTime,
  makeUtc,
  computeWindows,
  getCheckinWindow,
  buildAnnouncement,
  registeredCount,
  formatWhen,
  formatGameWhen,
  distanceMeters,
} from "./games";
import { toggleChoreClaim, refreshChoreMessage } from "./chores";
import { notifyAdminsRental } from "./notify";
import {
  createRideRequest,
  acceptRideRequest,
  declineRideRequest,
  cancelDriverRideRequests,
  announceDriverToSeekers,
} from "./carpool";
import { announceGame, REG_BTN, appendVideoLine, announceLinkPreview } from "./game-announce";
import {
  ingestSalesPhoto,
  findListingForDelete,
  deleteListing,
  type SellerInfo,
} from "./marketplace";

export const bot = new Bot(process.env.BOT_TOKEN!);

// Облік членства: будь-яка активність у групі → фіксуємо користувача як члена
// (так «доіндексовуємо» наявних учасників, яких Bot API не дає перелічити).
bot.use(async (ctx, next) => {
  const chat = ctx.chat;
  if (chat && (chat.type === "group" || chat.type === "supergroup") && ctx.from && !ctx.from.is_bot) {
    recordMemberSeen(ctx.from.id).catch(() => {});
  }
  await next();
});

// ─── Бали за фото-пост у топіку «Zdjęcia i filmy z gier / Фото та відео з ігор» (Етап 32) ───
// 1 бал за ПОСТ (фото/відео), незалежно від к-сті файлів: альбом (media_group_id) = 1 пост.
// Тижневий ліміт photo_weekly_cap балів на гравця. Лише прив'язані гравці (getPlayerByTg).
// Дедуп/ідемпотентність — таблиця photo_post_awards з UNIQUE(tg_chat_id, dedupe_key):
// кадри альбому й ретраї вебхука просто no-op. Реєструється ДО гардів топіків і завжди
// викликає next() (не термінальний) — щоб гард не видалив фото раніше за нарахування.
async function awardPhotoPost(ctx: Context): Promise<void> {
  const msg = ctx.message;
  const chat = ctx.chat;
  if (!msg || !chat) return;
  if (chat.type !== "group" && chat.type !== "supergroup") return;

  // Дешева синхронна відсічка ДО запитів у БД: переважна більшість повідомлень — не фото.
  const m = msg as any;
  if (!m.photo && !m.video) return; // топік «фото та відео»

  if (!(await featureEnabled("photo_award"))) return;
  // Економіка off → бали нікому не нараховуються. Виходимо ДО claim-рядка, інакше дедуп-ключ
  // зайнявся б із awarded_points=0 і цей пост уже ніколи не нарахувався б (коли економіку ввімкнуть).
  if (!(await featureEnabled("economy"))) return;

  const photosChatId = await getSetting("photos_chat_id");
  if (!photosChatId || String(chat.id) !== photosChatId) return;
  const threadId = await getSetting("photos_thread_id");
  const guardGeneral = (await getSetting("photos_guard_general")) === "true";
  if (!threadId && !guardGeneral) return; // топік не налаштовано (/setphotos)
  const inTarget = threadId
    ? String(msg.message_thread_id ?? "") === threadId
    : !msg.message_thread_id;
  if (!inTarget) return;

  const from = ctx.from;
  if (!from || from.is_bot) return;
  if (ctx.senderChat?.id === chat.id) return; // анонімно від імені групи
  if (from.id === ctx.me.id) return;

  const player = await getPlayerByTg(from.id);
  if (!player) return; // лише прив'язані гравці

  // Дедуп: альбом = 1 пост (mg:<media_group_id>); одиночне фото = 1 повідомлення (msg:<id>).
  const dedupeKey = m.media_group_id ? `mg:${m.media_group_id}` : `msg:${msg.message_id}`;
  const { data: claim } = await supabase
    .from("photo_post_awards")
    .upsert(
      {
        player_id: player.id,
        tg_chat_id: chat.id,
        dedupe_key: dedupeKey,
        message_id: msg.message_id,
        media_group_id: m.media_group_id ?? null,
      },
      { onConflict: "tg_chat_id,dedupe_key", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (!claim) return; // вже нараховано (кадр альбому / ретрай вебхука)

  // Тижневий ліміт: сума нарахованих балів за фото за останні 7 днів < photo_weekly_cap.
  const cap = await getPointValue("photo_weekly_cap", 5);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("photo_post_awards")
    .select("awarded_points")
    .eq("player_id", player.id)
    .gte("created_at", weekAgo);
  const usedThisWeek = (recent ?? []).reduce((s, r) => s + (r.awarded_points ?? 0), 0);
  if (usedThisWeek >= cap) return; // ліміт вичерпано — рядок claim лишається з awarded_points=0

  // Затискаємо нарахування під залишок тижневого ліміту — щоб один пост не перескочив cap,
  // якщо pts_photo_post > 1 (за дефолту 1 — це no-op).
  const pts = Math.min(await getPointValue("pts_photo_post", 1), cap - usedThisWeek);
  const delta = await awardPoints({
    playerId: player.id,
    reason: "photo_post",
    baseDelta: pts,
    meta: dedupeKey,
    hasPatch: !!player.has_patch,
  });
  if (delta > 0) {
    await supabase.from("photo_post_awards").update({ awarded_points: delta }).eq("id", claim.id);
  }
}

bot.use(async (ctx, next) => {
  await awardPhotoPost(ctx).catch((e) => console.error("photo award failed", e));
  await next();
});

// ─── Гард топіка «Анонси»: туди пише лише бот; решту — видаляємо ───
// 1-ше порушення → попередження в приват; 2-ге і кожне наступне → мут у групі
// на 1 год (заборона писати скрізь) + пояснення в приват. Лічильник — announce_violations.
const ANNOUNCE_MUTE_SECONDS = 60 * 60; // 1 година

async function guardAnnounceTopic(ctx: Context): Promise<boolean> {
  const msg = ctx.message;
  const chat = ctx.chat;
  if (!msg || !chat) return false;
  if (chat.type !== "group" && chat.type !== "supergroup") return false;
  if (!(await featureEnabled("announce_guard"))) return false;

  const guardChatId = await getSetting("announce_chat_id");
  if (!guardChatId || String(chat.id) !== guardChatId) return false;
  // Ціль гарду: конкретна тема (announce_thread_id) АБО головна тема «General»
  // (announce_guard_general=true) — у форумі повідомлення General не мають thread_id.
  const guardThreadId = await getSetting("announce_thread_id");
  const guardGeneral = (await getSetting("announce_guard_general")) === "true";
  if (!guardThreadId && !guardGeneral) return false; // гард не налаштовано
  const inTarget = guardThreadId
    ? String(msg.message_thread_id ?? "") === guardThreadId
    : !msg.message_thread_id;
  if (!inTarget) return false;

  // Службові повідомлення (вступ/вихід/піни/події теми) не модеруємо — лише контент.
  const m = msg as any;
  const hasContent =
    m.text || m.caption || m.photo || m.video || m.document || m.audio || m.voice ||
    m.sticker || m.animation || m.video_note || m.contact || m.location || m.venue ||
    m.poll || m.dice || m.game || m.story;
  if (!hasContent) return false;

  // Анонси публікуються «від імені групи» (анонімно) — саме так постить наш бот.
  // Telegram не дає відрізнити бота-від-групи від адміна-від-групи, тож такі пости
  // (sender_chat = ця група) НЕ чіпаємо — це й є анонси. Видаляємо лише сторонні.
  const from = ctx.from;
  if (ctx.senderChat?.id === chat.id) return false; // анонімно від імені групи = анонс
  if (from && from.id === ctx.me.id) return false; // наш бот напряму (про всяк випадок)

  // Видаляємо стороннє повідомлення (бот — адмін із can_delete_messages).
  try {
    await ctx.api.deleteMessage(chat.id, msg.message_id);
  } catch (e) {
    console.error("announce guard: delete failed", e);
  }

  // Мут/попередження — лише для звичайного користувача. Пости від іншого каналу (sender_chat)
  // та ботів видаляємо, але не мутимо й не пишемо в приват — у них немає особистого user_id.
  if (!from || from.is_bot) return true;

  // Лічильник порушень користувача.
  const { data: row } = await supabase
    .from("announce_violations")
    .select("count")
    .eq("tg_user_id", from.id)
    .maybeSingle();
  const violations = (row?.count ?? 0) + 1;
  await supabase.from("announce_violations").upsert(
    { tg_user_id: from.id, count: violations, last_at: new Date().toISOString() },
    { onConflict: "tg_user_id" },
  );

  const lang = ((await getPlayerByTg(from.id))?.lang as Lang) ?? "uk";

  if (violations === 1) {
    // Перше порушення — лише попередження в приват (у топіку нічого не постимо).
    try {
      await bot.api.sendMessage(from.id, tr(lang, "announce_guard_warn"));
    } catch {}
    return true;
  }

  // 2-ге і кожне наступне — мут у групі на годину + пояснення в приват.
  try {
    await ctx.api.restrictChatMember(
      chat.id,
      from.id,
      {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      },
      { until_date: Math.floor(Date.now() / 1000) + ANNOUNCE_MUTE_SECONDS },
    );
  } catch (e) {
    console.error("announce guard: restrict failed", e);
  }
  try {
    await bot.api.sendMessage(from.id, tr(lang, "announce_guard_muted"));
  } catch {}
  return true;
}

// Перехоплюємо повідомлення в топіку анонсів до інших хендлерів.
bot.use(async (ctx, next) => {
  if (await guardAnnounceTopic(ctx)) return; // видалили — далі не обробляємо
  await next();
});

// ─── Гард топіка «тільки медіа»: лишаємо фото/відео/документ; решту (текст тощо) видаляємо ───
// Адміни групи й майстер — виняток (можуть писати текст). Ескалація: 1-ше порушення → лише правила
// у приват; 2-ге → правила ще раз + попередження про мут; 3-тє і кожне наступне → мут у групі на 15 хв.
// Лічильник — media_violations.
const MEDIA_MUTE_SECONDS = 15 * 60; // 15 хвилин

async function guardMediaTopic(ctx: Context): Promise<boolean> {
  const msg = ctx.message;
  const chat = ctx.chat;
  if (!msg || !chat) return false;
  if (chat.type !== "group" && chat.type !== "supergroup") return false;
  if (!(await featureEnabled("media_guard"))) return false;

  const guardChatId = await getSetting("media_chat_id");
  if (!guardChatId || String(chat.id) !== guardChatId) return false;
  const guardThreadId = await getSetting("media_thread_id");
  const guardGeneral = (await getSetting("media_guard_general")) === "true";
  if (!guardThreadId && !guardGeneral) return false; // гілку не налаштовано
  const inTarget = guardThreadId
    ? String(msg.message_thread_id ?? "") === guardThreadId
    : !msg.message_thread_id;
  if (!inTarget) return false;

  const m = msg as any;
  // Дозволені типи: фото / відео / документ (з підписом чи без). Підпис іде разом із медіа.
  if (m.photo || m.video || m.document) return false; // це медіа — пропускаємо

  // Службові повідомлення (вступ/вихід/піни) не чіпаємо — лише контент без медіа видаляємо.
  const hasContent =
    m.text || m.caption || m.audio || m.voice || m.sticker || m.animation ||
    m.video_note || m.contact || m.location || m.venue || m.poll || m.dice || m.game || m.story;
  if (!hasContent) return false;

  // Анонімно від імені групи / сам бот — не чіпаємо.
  const from = ctx.from;
  if (ctx.senderChat?.id === chat.id) return false;
  if (from && from.id === ctx.me.id) return false;

  // Виняток: майстер (БД) і адміни групи (creator/administrator) можуть писати текст.
  let player: any = null;
  if (from) {
    player = await getPlayerByTg(from.id);
    if (player?.is_master) return false;
    try {
      const mem = await ctx.api.getChatMember(chat.id, from.id);
      if (mem.status === "creator" || mem.status === "administrator") return false;
    } catch (e) {
      console.error("media guard: getChatMember failed", e);
    }
  }

  // Видаляємо не-медіа повідомлення (бот — адмін із can_delete_messages).
  try {
    await ctx.api.deleteMessage(chat.id, msg.message_id);
  } catch (e) {
    console.error("media guard: delete failed", e);
  }

  // Лічильник/покарання — лише для звичайного користувача (не канал, не бот).
  if (!from || from.is_bot) return true;

  const { data: row } = await supabase
    .from("media_violations")
    .select("count")
    .eq("tg_user_id", from.id)
    .maybeSingle();
  const violations = (row?.count ?? 0) + 1;
  await supabase.from("media_violations").upsert(
    { tg_user_id: from.id, count: violations, last_at: new Date().toISOString() },
    { onConflict: "tg_user_id" },
  );

  const lang = (player?.lang as Lang) ?? "uk";

  if (violations === 1) {
    // Перше порушення — лише правила у приват (без попередження про наступне).
    try {
      await bot.api.sendMessage(from.id, tr(lang, "media_guard_warn"));
    } catch {}
    return true;
  }
  if (violations === 2) {
    // Друге — правила ще раз + попередження про мут.
    try {
      await bot.api.sendMessage(from.id, tr(lang, "media_guard_warn2"));
    } catch {}
    return true;
  }

  // 3-тє і кожне наступне — мут у групі на 15 хв + пояснення в приват.
  try {
    await ctx.api.restrictChatMember(
      chat.id,
      from.id,
      {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      },
      { until_date: Math.floor(Date.now() / 1000) + MEDIA_MUTE_SECONDS },
    );
  } catch (e) {
    console.error("media guard: restrict failed", e);
  }
  try {
    await bot.api.sendMessage(from.id, tr(lang, "media_guard_muted"));
  } catch {}
  return true;
}

// Гілка «тільки медіа»: лишаємо фото/відео/документ, решту видаляємо.
bot.use(async (ctx, next) => {
  if (await guardMediaTopic(ctx)) return; // видалили — далі не обробляємо
  await next();
});

// ─── Гард гілки «Барахолка»: лише ФОТО З ОПИСОМ; решту (текст/відео/файли, а також
// фото без опису) видаляємо. Публікація на сайт — лише з тегом #promo + патч (Етап 28).
// Гілку задає /setsales (sales_chat_id / sales_thread_id / sales_guard_general).
const SALES_MUTE_SECONDS = 15 * 60; // 15 хв

function sellerOf(from: any, player: any): SellerInfo {
  return {
    playerId: player.id,
    tgUserId: from.id,
    username: from.username ?? player.tg_username ?? null,
    display: player.callsign ?? player.name ?? from.first_name ?? null,
    lang: (player.lang as Lang) ?? "uk",
    hasPatch: !!player.has_patch,
  };
}

// Виняток від видалення: анонім від імені групи, сам бот, майстер, адмін групи.
async function salesExempt(ctx: Context, chatId: number, from: any, player: any): Promise<boolean> {
  if (ctx.senderChat?.id === chatId) return true;
  if (from && from.id === ctx.me.id) return true;
  if (player?.is_master) return true;
  if (from) {
    try {
      const mem = await ctx.api.getChatMember(chatId, from.id);
      if (mem.status === "creator" || mem.status === "administrator") return true;
    } catch (e) {
      console.error("sales guard: getChatMember failed", e);
    }
  }
  return false;
}

// /delete — зняти оголошення (reply на оригінал або на репост/пересилку).
async function handleSalesDelete(ctx: Context, player: any) {
  const from = ctx.from!;
  const chat = ctx.chat!;
  const reply = (ctx.message as any)?.reply_to_message;
  const lang = (player?.lang as Lang) ?? "uk";
  if (!reply) {
    try { await bot.api.sendMessage(from.id, tr(lang, "mp_delete_not_found")); } catch {}
    return;
  }
  const listing = await findListingForDelete(chat.id, reply, from.id);
  if (!listing) {
    try { await bot.api.sendMessage(from.id, tr(lang, "mp_delete_not_found")); } catch {}
    return;
  }
  const isAdmin = player && (player.is_master || hasPerm(player, "marketplace"));
  if (listing.seller_tg_user_id !== from.id && !isAdmin) {
    try { await bot.api.sendMessage(from.id, tr(lang, "mp_delete_not_yours")); } catch {}
    return;
  }
  await deleteListing(ctx.api, listing, true);
  try { await ctx.api.deleteMessage(chat.id, reply.message_id); } catch {}
  try { await bot.api.sendMessage(from.id, tr(lang, "mp_deleted_ok")); } catch {}
}

async function guardSalesTopic(ctx: Context): Promise<boolean> {
  const msg = ctx.message;
  const chat = ctx.chat;
  if (!msg || !chat) return false;
  if (chat.type !== "group" && chat.type !== "supergroup") return false;
  if (!(await featureEnabled("marketplace"))) return false;

  const guardChatId = await getSetting("sales_chat_id");
  if (!guardChatId || String(chat.id) !== guardChatId) return false;
  const guardThreadId = await getSetting("sales_thread_id");
  const guardGeneral = (await getSetting("sales_guard_general")) === "true";
  if (!guardThreadId && !guardGeneral) return false; // гілку не налаштовано
  const inTarget = guardThreadId
    ? String(msg.message_thread_id ?? "") === guardThreadId
    : !msg.message_thread_id;
  if (!inTarget) return false;

  const m = msg as any;
  const from = ctx.from;
  const fromUser = !!from && !from.is_bot && ctx.senderChat?.id !== chat.id;

  // Гравець (для info-DM, мови, патча, винятків). ensurePlayer — гілка малотрафічна.
  const player = fromUser ? await ensurePlayer(from!) : null;

  // Інфо/згода при ПЕРШОМУ повідомленні в гілку (будь-якому) — раз на гравця.
  if (player && !player.marketplace_info_sent_at) {
    const lang = (player.lang as Lang) ?? "uk";
    const flood = (await getSetting("marketplace_flood_hint")) || "";
    const hint = (await getSetting("marketplace_patch_hint")) || "";
    try { await bot.api.sendMessage(from!.id, tr(lang, "mp_info", { flood, hint })); } catch {}
    await supabase
      .from("players")
      .update({ marketplace_info_sent_at: new Date().toISOString() })
      .eq("id", player.id);
  }

  // /delete — до загального видалення (це текст, інакше гард його з'їв би).
  if (m.text && /^\/delete(@\w+)?\b/i.test(String(m.text).trim()) && m.reply_to_message) {
    await handleSalesDelete(ctx, player);
    try { await ctx.api.deleteMessage(chat.id, msg.message_id); } catch {}
    return true;
  }

  const isForward = !!(m.forward_origin || m.forward_from || m.forward_from_chat || m.forward_sender_name);

  // Переслане фото (репост) — указівник для /delete; не створюємо оголошення, лишаємо.
  if (m.photo && isForward) return true;

  // Альбом — дозбираємо й (з debounce) фіналізуємо в одне оголошення.
  if (m.photo && m.media_group_id) {
    if (player && from) {
      const big = m.photo[m.photo.length - 1];
      await ingestSalesPhoto(ctx.api, {
        chatId: chat.id,
        messageId: msg.message_id,
        mediaGroupId: String(m.media_group_id),
        fileId: big.file_id,
        fileUniqueId: big.file_unique_id,
        caption: m.caption ?? null,
        seller: sellerOf(from, player),
      });
    }
    return true;
  }

  // Одиночне фото.
  if (m.photo) {
    const caption = String(m.caption ?? "").trim();
    if (caption && player && from) {
      const big = m.photo[m.photo.length - 1];
      await ingestSalesPhoto(ctx.api, {
        chatId: chat.id,
        messageId: msg.message_id,
        mediaGroupId: null,
        fileId: big.file_id,
        fileUniqueId: big.file_unique_id,
        caption,
        seller: sellerOf(from, player),
      });
      return true;
    }
    // Фото без опису → видалити + прохання додати опис (без ескалації мута).
    if (await salesExempt(ctx, chat.id, from, player)) return true;
    try { await ctx.api.deleteMessage(chat.id, msg.message_id); } catch {}
    if (player && from) {
      try { await bot.api.sendMessage(from.id, tr((player.lang as Lang) ?? "uk", "mp_need_caption")); } catch {}
    }
    return true;
  }

  // Службові повідомлення без контенту — не чіпаємо.
  const hasContent =
    m.text || m.caption || m.video || m.document || m.audio || m.voice || m.sticker ||
    m.animation || m.video_note || m.contact || m.location || m.venue || m.poll || m.dice ||
    m.game || m.story;
  if (!hasContent) return false;

  // Виняток (майстер/адмін/анонім/бот) — текст лишаємо.
  if (await salesExempt(ctx, chat.id, from, player)) return false;

  // Не-фото контент (текст/відео/файл/…) → видалити + ескалація.
  try { await ctx.api.deleteMessage(chat.id, msg.message_id); } catch {}
  if (!from || from.is_bot) return true;

  const { data: row } = await supabase
    .from("marketplace_violations")
    .select("count")
    .eq("tg_user_id", from.id)
    .maybeSingle();
  const violations = (row?.count ?? 0) + 1;
  await supabase.from("marketplace_violations").upsert(
    { tg_user_id: from.id, count: violations, last_at: new Date().toISOString() },
    { onConflict: "tg_user_id" },
  );
  const lang = (player?.lang as Lang) ?? "uk";
  if (violations === 1) {
    try { await bot.api.sendMessage(from.id, tr(lang, "mp_guard_warn")); } catch {}
    return true;
  }
  if (violations === 2) {
    try { await bot.api.sendMessage(from.id, tr(lang, "mp_guard_warn2")); } catch {}
    return true;
  }
  try {
    await ctx.api.restrictChatMember(
      chat.id,
      from.id,
      {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      },
      { until_date: Math.floor(Date.now() / 1000) + SALES_MUTE_SECONDS },
    );
  } catch (e) {
    console.error("sales guard: restrict failed", e);
  }
  try { await bot.api.sendMessage(from.id, tr(lang, "mp_guard_muted")); } catch {}
  return true;
}

bot.use(async (ctx, next) => {
  if (await guardSalesTopic(ctx)) return; // оброблено — далі не йдемо
  await next();
});

// Апдейти chat_member: вступ/вихід учасників (потрібен allowed_updates: chat_member).
bot.on("chat_member", async (ctx) => {
  const upd = ctx.chatMember;
  const tgId = upd.new_chat_member.user.id;
  if (upd.new_chat_member.user.is_bot) return;
  const status = upd.new_chat_member.status;
  if (status === "left" || status === "kicked") {
    await recordMemberLeft(tgId);
  } else {
    await recordMemberSeen(tgId);
  }
});

// Право адміна (майстер має всі права).
function hasPerm(p: any, perm: string): boolean {
  return !!p.is_master || (Array.isArray(p.admin_perms) && p.admin_perms.includes(perm));
}
const canCheckin = (p: any) => hasPerm(p, "games");

// ─────────────────────────────── Команди ───────────────────────────────

bot.command("start", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const existedBefore = await getPlayerByTg(ctx.from!.id); // null → новачок
  const p = await ensurePlayer(ctx.from!);
  const payload = typeof ctx.match === "string" ? ctx.match : "";
  const m = payload.match(/^g(\d+)$/);
  if (m) {
    await showGameCard(ctx, p, Number(m[1]));
    return;
  }
  if (payload === "games") {
    await showGamesList(ctx, p);
    return;
  }
  const r = payload.match(/^ref(\d+)$/);
  if (r) {
    await bindReferral(p, Number(r[1]), !existedBefore);
  }
  await ctx.reply(tr(p.lang as Lang, "start"));
});

bot.command("ref", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!(await featureEnabled("referrals"))) {
    await ctx.reply(tr(lang, "ref_off"));
    return;
  }
  if ((p.games_played ?? 0) < 1) {
    await ctx.reply(tr(lang, "ref_need_play"));
    return;
  }
  const link = `https://t.me/${ctx.me.username}?start=ref${p.id}`;
  const { count } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("inviter_id", p.id)
    .eq("status", "confirmed");
  const pts = await getPointValue("pts_friend", 10);
  await ctx.reply(tr(lang, "ref_link", { link, pts, confirmed: count ?? 0 }));
});

bot.command("linksite", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!(await featureEnabled("site_link"))) {
    await ctx.reply(tr(lang, "linksite_off"));
    return;
  }
  const { code } = await createLinkCode(p.id, ctx.from!.id);
  const url = (await getSetting("site_url")) ?? "https://www.rxteam.pl";
  await ctx.reply(tr(lang, "linksite_msg", { code, min: 15, url }));
});

// ─────────────────────────── Найближчі ігри (/games) ───────────────────────────

// Список усіх найближчих анонсованих ігор — записатись/виписатись з одного місця.
// Спільний для команди /games і deep-link ?start=games (кнопка під щоденним нагадуванням).
async function showGamesList(ctx: Context, p: any) {
  const lang = p.lang as Lang;
  const cutoff = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const { data: games } = await supabase
    .from("games")
    .select("id, title, start_at")
    .eq("status", "announced")
    .gt("start_at", cutoff)
    .order("start_at");
  if (!games || !games.length) {
    await ctx.reply(tr(lang, "games_none"));
    return;
  }
  // Ігри, на які гравець уже записаний — позначаємо ✅.
  const { data: regs } = await supabase
    .from("registrations")
    .select("game_id")
    .eq("player_id", p.id)
    .eq("status", "registered");
  const mine = new Set((regs ?? []).map((r) => r.game_id));
  const kb = new InlineKeyboard();
  games.forEach((g) =>
    kb
      .text(
        `${mine.has(g.id) ? "✅ " : ""}${g.title ?? "#" + g.id} — ${formatWhen(g.start_at)}`,
        `games:${g.id}`,
      )
      .row(),
  );
  await ctx.reply(tr(lang, "games_pick"), { reply_markup: kb });
}

bot.command("games", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  await showGamesList(ctx, p);
});

bot.callbackQuery(/^games:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  await showGameCard(ctx, p, Number(ctx.match[1]));
});

// ─────────────────────────── Carpool: водії ───────────────────────────

bot.command("drivers", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  const games = await myUpcomingGames(p.id);
  if (!games.length) {
    await ctx.reply(tr(lang, "drivers_none_games"));
    return;
  }
  if (games.length === 1) {
    await showDrivers(ctx, lang, games[0].id, games[0].title);
    return;
  }
  const kb = new InlineKeyboard();
  games.forEach((g) =>
    kb.text(`${g.title ?? "#" + g.id} — ${formatWhen(g.start_at)}`, `drivers:${g.id}`).row(),
  );
  await ctx.reply(tr(lang, "drivers_pick_game"), { reply_markup: kb });
});

bot.callbackQuery(/^drivers:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const gameId = Number(ctx.match[1]);
  const { data: game } = await supabase.from("games").select("title").eq("id", gameId).single();
  await showDrivers(ctx, p.lang as Lang, gameId, game?.title ?? null);
});

// Ігри, на які гравець зараз записаний (не давніші за ~3 год тому).
async function myUpcomingGames(playerId: number) {
  const { data: regs } = await supabase
    .from("registrations")
    .select("games(id, title, start_at, status)")
    .eq("player_id", playerId)
    .eq("status", "registered");
  const cutoff = Date.now() - 3 * 3600 * 1000;
  return (regs ?? [])
    .map((r) => (r as any).games)
    // Лише активні ігри: скасування гри не чистить реєстрації, тому відсіюємо скасовані за статусом гри.
    .filter((g) => g && g.status === "announced" && new Date(g.start_at).getTime() > cutoff)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
}

async function showDrivers(
  ctx: Context,
  lang: Lang,
  gameId: number,
  title: string | null,
  emptyKey = "drivers_empty",
) {
  const { data: drivers } = await supabase
    .from("registrations")
    .select("player_id, from_place, from_lat, from_lng, ride_price, ride_note, pickups, free_seats, seats_closed, players(callsign, name, tg_username)")
    .eq("game_id", gameId)
    .eq("status", "registered")
    .eq("transport", "own");
  const offering = (drivers ?? []).filter((d) => (d.free_seats ?? 0) > 0);
  if (!offering.length) {
    await ctx.reply(tr(lang, emptyKey));
    return;
  }
  const lines = offering.map((d) => {
    const pl = (d as any).players;
    const who = pl?.callsign ?? pl?.name ?? "?";
    const from = d.from_place ?? "—";
    const price = d.ride_price != null ? `${d.ride_price} zł` : "—";
    // Точка виїзду на мапі (Етап 34) — якщо водій її поставив.
    const mapLink =
      d.from_lat != null && d.from_lng != null
        ? `\n🗺 https://maps.google.com/?q=${d.from_lat},${d.from_lng}`
        : "";
    // Точки підбору по дорозі (Етап 36) — показуємо лічильник.
    const pcount = Array.isArray(d.pickups) ? d.pickups.length : 0;
    const pickupLine = pcount > 0 ? "\n" + tr(lang, "drivers_pickups", { n: pcount }) : "";
    // Коментар водія для пасажирів (Етап 37).
    const noteLine = d.ride_note ? `\n💬 ${d.ride_note}` : "";
    if (d.seats_closed) return tr(lang, "drivers_line_closed", { who, from, price }) + mapLink + pickupLine + noteLine;
    const contact = pl?.tg_username ? "@" + pl.tg_username : tr(lang, "drivers_contact_none");
    return tr(lang, "drivers_line", { who, from, price, seats: d.free_seats ?? 0, contact }) + mapLink + pickupLine + noteLine;
  });

  // Кнопки «Прошу місце» — лише для відкритих оферт і не собі (Етап 34, під фічфлагом).
  let reply_markup: InlineKeyboard | undefined;
  if (await featureEnabled("carpool_map")) {
    const viewer = ctx.from ? await getPlayerByTg(ctx.from.id) : null;
    const kb = new InlineKeyboard();
    let any = false;
    for (const d of offering) {
      if (d.seats_closed) continue;
      if (viewer && d.player_id === viewer.id) continue; // не пропонуємо бронювати в себе
      const pl = (d as any).players;
      const who = pl?.callsign ?? pl?.name ?? "?";
      kb.text(tr(lang, "btn_request_seat", { who }), `rideask:${gameId}:${d.player_id}`).row();
      any = true;
    }
    if (any) reply_markup = kb;
  }

  await ctx.reply(
    tr(lang, "drivers_title", { title: title ?? "ASG" }) + "\n\n" + lines.join("\n"),
    reply_markup ? { reply_markup } : undefined,
  );
}

// ─────────────────── Лотерея надійних + «У цифрах» ───────────────────

// Гравці з чек-іном і 0 неявок за квартал [start,end). Повертає повні рядки.
async function eligibleReliable(startIso: string, endIso: string) {
  const { data: games } = await supabase
    .from("games")
    .select("id")
    .gte("start_at", startIso)
    .lt("start_at", endIso);
  const gameIds = (games ?? []).map((g) => g.id);
  if (!gameIds.length) return [];
  const { data: checks } = await supabase
    .from("checkins")
    .select("player_id")
    .in("game_id", gameIds);
  const { data: ns } = await supabase
    .from("registrations")
    .select("player_id")
    .eq("status", "no_show")
    .in("game_id", gameIds);
  const noShow = new Set((ns ?? []).map((r) => r.player_id));
  const attended = [...new Set((checks ?? []).map((c) => c.player_id))].filter(
    (id) => !noShow.has(id),
  );
  if (!attended.length) return [];
  const { data: players } = await supabase
    .from("players")
    .select("id, callsign, name, lang, tg_user_id, has_patch")
    .in("id", attended);
  return players ?? [];
}

bot.command("lottery", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!hasPerm(p, "games")) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  if (!(await featureEnabled("lottery"))) {
    await ctx.reply(tr(lang, "lottery_off"));
    return;
  }
  const q = prevQuarter();
  const { data: prev } = await supabase
    .from("season_runs")
    .select("winner_id")
    .eq("quarter", q.label)
    .maybeSingle();
  if (prev) {
    const { data: w } = prev.winner_id
      ? await supabase.from("players").select("callsign, name").eq("id", prev.winner_id).single()
      : { data: null };
    await ctx.reply(tr(lang, "lottery_already", { q: q.label, who: w?.callsign ?? w?.name ?? "—" }));
    return;
  }

  const eligible = await eligibleReliable(q.start.toISO()!, q.end.toISO()!);
  // Ачівка Iron Discipline усім, хто без неявок за квартал (DM шле grantAchievement).
  for (const e of eligible) {
    await grantAchievement(e.id, "iron_discipline", null, !!e.has_patch);
  }
  if (!eligible.length) {
    await supabase.from("season_runs").insert({ quarter: q.label, winner_id: null, eligible_count: 0 });
    await ctx.reply(tr(lang, "lottery_no_eligible", { q: q.label }));
    return;
  }
  const winner = eligible[Math.floor(Math.random() * eligible.length)];
  await supabase
    .from("season_runs")
    .insert({ quarter: q.label, winner_id: winner.id, eligible_count: eligible.length });
  const who = winner.callsign ?? winner.name ?? "—";

  const chatId = await getSetting("announce_chat_id");
  if (chatId) {
    const threadId = await getSetting("announce_thread_id");
    try {
      await ctx.api.sendMessage(Number(chatId), lotteryWinnerText(q.label, who, eligible.length), {
        ...(threadId ? { message_thread_id: Number(threadId) } : {}),
      });
    } catch (e) {
      console.error("lottery post failed", e);
    }
  }
  await ctx.reply(tr(lang, "lottery_done_admin", { q: q.label, n: eligible.length, who }));
});

bot.command("stats", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  const q = currentQuarter();
  const sIso = q.start.toISO()!;
  const eIso = q.end.toISO()!;
  const { data: games } = await supabase
    .from("games")
    .select("id")
    .gte("start_at", sIso)
    .lt("start_at", eIso);
  const gameIds = (games ?? []).map((g) => g.id);
  const { data: checks } = gameIds.length
    ? await supabase.from("checkins").select("player_id").in("game_id", gameIds)
    : { data: [] };
  const { count: noshows } = gameIds.length
    ? await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("status", "no_show")
        .in("game_id", gameIds)
    : { count: 0 };
  const { count: newcomers } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sIso)
    .lt("created_at", eIso);
  const uniquePlayers = new Set((checks ?? []).map((c) => c.player_id)).size;
  await ctx.reply(
    tr(lang, "stats", {
      q: q.label,
      games: gameIds.length,
      checkins: (checks ?? []).length,
      players: uniquePlayers,
      newcomers: newcomers ?? 0,
      noshows: noshows ?? 0,
    }),
  );
});

// ─────────────────────── Голосування за локацію ───────────────────────

bot.command("poll", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!hasPerm(p, "games")) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  if (!(await featureEnabled("voting"))) {
    await ctx.reply(tr(lang, "poll_off"));
    return;
  }
  const chatId = await getSetting("announce_chat_id");
  if (!chatId) {
    await ctx.reply(tr(lang, "gamenew_no_topic"));
    return;
  }
  const { data: locs } = await supabase.from("locations").select("id, name").order("id");
  if (!locs || locs.length < 2) {
    await ctx.reply(tr(lang, "poll_need_loc"));
    return;
  }
  const picked = locs.slice(0, 10); // Telegram-poll: максимум 10 опцій
  const options = picked.map((l) => l.name.slice(0, 100));
  const threadId = await getSetting("announce_thread_id");
  const msg = await ctx.api.sendPoll(Number(chatId), POLL_QUESTION, options, {
    is_anonymous: true,
    ...(threadId ? { message_thread_id: Number(threadId) } : {}),
  });
  await supabase.from("polls").insert({
    tg_poll_id: msg.poll.id,
    chat_id: Number(chatId),
    message_id: msg.message_id,
    thread_id: threadId ? Number(threadId) : null,
    location_ids: picked.map((l) => l.id),
    status: "open",
  });
  await ctx.reply(tr(lang, "poll_posted"));
});

bot.command("pollclose", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!hasPerm(p, "games")) {
    await ctx.reply(tr(lang, "not_admin"));
    return;
  }
  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("status", "open")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!poll) {
    await ctx.reply(tr(lang, "poll_none_open"));
    return;
  }
  let winnerIdx = 0;
  let winnerVotes = 0;
  try {
    const stopped = await ctx.api.stopPoll(poll.chat_id, poll.message_id);
    stopped.options.forEach((o, i) => {
      if (o.voter_count > winnerVotes) {
        winnerVotes = o.voter_count;
        winnerIdx = i;
      }
    });
  } catch (e) {
    console.error("stopPoll failed", e);
  }
  await supabase
    .from("polls")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", poll.id);

  const locId = (poll.location_ids as number[])[winnerIdx];
  const { data: loc } = await supabase.from("locations").select("name").eq("id", locId).single();
  try {
    await ctx.api.sendMessage(poll.chat_id, pollWinnerText(loc?.name ?? "—", winnerVotes), {
      ...(poll.thread_id ? { message_thread_id: poll.thread_id } : {}),
    });
  } catch (e) {
    console.error("winner post failed", e);
  }
  await ctx.reply(tr(lang, "poll_closed_admin"));
});

// ─────────────────────── Carpool: керування водія ───────────────────────

bot.command("myride", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  const games = await myDriverGames(p.id);
  if (!games.length) {
    await ctx.reply(tr(lang, "myride_none"));
    return;
  }
  if (games.length === 1) {
    const { text, kb } = await renderRide(p.id, games[0].id, lang);
    await ctx.reply(text, { reply_markup: kb });
    return;
  }
  const kb = new InlineKeyboard();
  games.forEach((g) =>
    kb.text(`${g.title ?? "#" + g.id} — ${formatWhen(g.start_at)}`, `ride:${g.id}`).row(),
  );
  await ctx.reply(tr(lang, "myride_pick"), { reply_markup: kb });
});

bot.callbackQuery(/^ride:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const { text, kb } = await renderRide(p.id, Number(ctx.match[1]), p.lang as Lang);
  await ctx.editMessageText(text, { reply_markup: kb });
});

bot.callbackQuery(/^rideseat:(\d+):(-?\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const gameId = Number(ctx.match[1]);
  const delta = Number(ctx.match[2]);
  const { data: reg } = await supabase
    .from("registrations")
    .select("free_seats")
    .eq("game_id", gameId)
    .eq("player_id", p.id)
    .maybeSingle();
  const seats = Math.max(0, Math.min(20, (reg?.free_seats ?? 0) + delta));
  await supabase
    .from("registrations")
    .update({ free_seats: seats })
    .eq("game_id", gameId)
    .eq("player_id", p.id);
  const { text, kb } = await renderRide(p.id, gameId, p.lang as Lang);
  await ctx.editMessageText(text, { reply_markup: kb });
});

bot.callbackQuery(/^rideclose:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const gameId = Number(ctx.match[1]);
  const { data: reg } = await supabase
    .from("registrations")
    .select("seats_closed")
    .eq("game_id", gameId)
    .eq("player_id", p.id)
    .maybeSingle();
  await supabase
    .from("registrations")
    .update({ seats_closed: !reg?.seats_closed })
    .eq("game_id", gameId)
    .eq("player_id", p.id);
  const { text, kb } = await renderRide(p.id, gameId, p.lang as Lang);
  await ctx.editMessageText(text, { reply_markup: kb });
});

bot.callbackQuery("noop", (ctx) => ctx.answerCallbackQuery());

// Ігри, де гравець записаний водієм («своїм ходом»).
async function myDriverGames(playerId: number) {
  const { data: regs } = await supabase
    .from("registrations")
    .select("games(id, title, start_at, status)")
    .eq("player_id", playerId)
    .eq("status", "registered")
    .eq("transport", "own");
  const cutoff = Date.now() - 3 * 3600 * 1000;
  return (regs ?? [])
    .map((r) => (r as any).games)
    // Лише активні ігри (скасовані не чистять реєстрації — фільтруємо за статусом гри).
    .filter((g) => g && g.status === "announced" && new Date(g.start_at).getTime() > cutoff)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
}

async function renderRide(playerId: number, gameId: number, lang: Lang) {
  const { data: reg } = await supabase
    .from("registrations")
    .select("from_place, ride_price, free_seats, seats_closed")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .maybeSingle();
  const { data: game } = await supabase.from("games").select("title").eq("id", gameId).single();
  const seats = reg?.free_seats ?? 0;
  const closed = !!reg?.seats_closed;
  const text = tr(lang, "myride_panel", {
    title: game?.title ?? "ASG",
    from: reg?.from_place ?? "—",
    price: reg?.ride_price != null ? `${reg.ride_price} zł` : "—",
    seats,
    status: tr(lang, closed ? "myride_status_closed" : "myride_status_open"),
  });
  const kb = new InlineKeyboard()
    .text("➖", `rideseat:${gameId}:-1`)
    .text(String(seats), "noop")
    .text("➕", `rideseat:${gameId}:1`)
    .row()
    .text(tr(lang, closed ? "btn_ride_open" : "btn_ride_close"), `rideclose:${gameId}`)
    .row()
    .text(tr(lang, "btn_ride_pin"), `ridepin:${gameId}`);
  return { text, kb };
}

// Водій ставить точку виїзду з бота: просимо надіслати локацію (стан ride_pin).
bot.callbackQuery(/^ridepin:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  await setState(ctx.from.id, "ride_pin", { gameId: Number(ctx.match[1]) });
  await ctx.reply(tr(p.lang as Lang, "ride_ask_pin"));
});

// Пасажир просить місце у водія (кнопка з /drivers). Уся валідація + DM водію — у createRideRequest.
bot.callbackQuery(/^rideask:(\d+):(\d+)$/, async (ctx) => {
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  const gameId = Number(ctx.match[1]);
  const driverPlayerId = Number(ctx.match[2]);
  if (!(await featureEnabled("carpool_map"))) {
    await ctx.answerCallbackQuery();
    return;
  }
  const res = await createRideRequest(gameId, driverPlayerId, p.id);
  if (res.ok) {
    const { data: drv } = await supabase
      .from("players")
      .select("callsign, name")
      .eq("id", driverPlayerId)
      .maybeSingle();
    await ctx.answerCallbackQuery({
      text: tr(lang, "ride_request_sent_passenger", { who: drv?.callsign ?? drv?.name ?? "?" }),
      show_alert: true,
    });
    return;
  }
  const key =
    res.reason === "self"
      ? "ride_self"
      : res.reason === "duplicate"
        ? "ride_already_requested"
        : res.reason === "closed" || res.reason === "full"
          ? "ride_no_seats"
          : "ride_request_failed";
  await ctx.answerCallbackQuery({ text: tr(lang, key), show_alert: true });
});

// Водій ПРИЙМАЄ запит (кнопка в DM, що прийшов із сайту або бота). Атомарне списання — у acceptRideRequest.
bot.callbackQuery(/^rideok:(\d+)$/, async (ctx) => {
  const driver = await ensurePlayer(ctx.from);
  const lang = driver.lang as Lang;
  const requestId = Number(ctx.match[1]);
  const { data: req } = await supabase
    .from("ride_requests")
    .select("driver_player_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.driver_player_id !== driver.id) {
    await ctx.answerCallbackQuery();
    return;
  }
  if (req.status !== "pending") {
    await ctx.answerCallbackQuery({ text: tr(lang, "ride_decided_already"), show_alert: true });
    return;
  }
  const res = await acceptRideRequest(requestId);
  await ctx.answerCallbackQuery();
  try {
    await ctx.editMessageText(tr(lang, res.ok ? "ride_accepted_driver" : "ride_no_seats"));
  } catch {}
});

// Водій ВІДХИЛЯЄ запит.
bot.callbackQuery(/^rideno:(\d+)$/, async (ctx) => {
  const driver = await ensurePlayer(ctx.from);
  const lang = driver.lang as Lang;
  const requestId = Number(ctx.match[1]);
  const { data: req } = await supabase
    .from("ride_requests")
    .select("driver_player_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.driver_player_id !== driver.id) {
    await ctx.answerCallbackQuery();
    return;
  }
  await declineRideRequest(requestId);
  await ctx.answerCallbackQuery();
  try {
    await ctx.editMessageText(tr(lang, "ride_declined_driver"));
  } catch {}
});

// Чи перебуває користувач ЗАРАЗ у групі (Telegram getChatMember по announce_chat_id).
async function isCurrentGroupMember(tgUserId?: number | null): Promise<boolean> {
  if (!tgUserId) return false;
  const groupId = await getSetting("announce_chat_id");
  if (!groupId) return false;
  try {
    const m = await bot.api.getChatMember(Number(groupId), tgUserId);
    return ["creator", "administrator", "member", "restricted"].includes(m.status);
  } catch {
    return false;
  }
}

// Прив'язує новачка до інвайтера (лише якщо це СПРАВДІ нова людина).
async function bindReferral(invited: any, inviterId: number, isNewcomer: boolean) {
  if (!isNewcomer || inviterId === invited.id) return;
  if (!(await featureEnabled("referrals"))) return;
  // Анти-абуз: не нараховуємо за того, хто вже був у групі.
  //  - viходив колись (left_at у group_members) → повернувся по лінку;
  //  - або вже зараз є учасником групи (наявний член «прийшов по лінку»).
  if (await hasEverLeft(invited.tg_user_id)) return;
  if (await isCurrentGroupMember(invited.tg_user_id)) return;
  const { data: existing } = await supabase
    .from("referrals")
    .select("id")
    .eq("invited_id", invited.id)
    .maybeSingle();
  if (existing) return; // вже прив'язаний
  const { data: inviter } = await supabase
    .from("players")
    .select("id, games_played")
    .eq("id", inviterId)
    .maybeSingle();
  if (!inviter || (inviter.games_played ?? 0) < 1) return; // запрошувати може лише той, хто грав
  await supabase
    .from("referrals")
    .insert({ inviter_id: inviterId, invited_id: invited.id, status: "pending" });
}

// Авто-зарахування реферала на ПЕРШОМУ чек-іні новачка (ядро — lib/referrals.ts),
// тут лише Telegram-нотифікація інвайтеру.
async function confirmReferral(invited: any, gameId: number, gamesPlayedAfter: number) {
  const res = await confirmReferralCore(invited, gameId, gamesPlayedAfter);
  if (!res) return;
  const ilang = (res.inviter.lang as Lang) ?? "uk";
  // Знижка на цю гру: 1 друг → −50%, 2+ → безкоштовно.
  const discount =
    res.confirmedCount >= 2 ? tr(ilang, "ref_disc_free") : tr(ilang, "ref_disc_half");
  if (res.inviter.tg_user_id) {
    try {
      await bot.api.sendMessage(
        res.inviter.tg_user_id,
        tr(ilang, "ref_bonus_inviter", {
          who: res.invitedWho,
          pts: res.pts,
          title: res.gameTitle ?? "ASG",
          discount,
        }),
      );
    } catch {}
    // Ачівку «recruiter» інвайтеру шле сам grantAchievement (усередині confirmReferralCore).
  }
}

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
    patch: p.has_patch
      ? p.patch_at
        ? `${tr(lang, "patch_received")} ${formatGameWhen(p.patch_at, lang)}`
        : tr(lang, "patch_yes")
      : tr(lang, "patch_no"),
    games: p.games_played ?? 0,
    earned: p.points_earned ?? 0,
    balance: p.points_balance ?? 0,
    reliability: rel.pct === null ? "—" : `${rel.pct}%`,
  });
  if (p.is_master) msg += "\n" + tr(lang, "badge_master");
  else if (p.is_admin) msg += "\n" + tr(lang, "badge_admin");
  if (!p.has_patch && (await featureEnabled("patch"))) {
    msg += "\n\n" + tr(lang, "patch_profile_hint");
  }
  await ctx.reply(msg);
});

bot.command("rules", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  await ctx.reply(await getFaqText(p.lang as Lang));
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
  // Мова адміна, що виконує команду (pl/en/uk); для анонімного адміна (senderChat) → uk.
  const actorLang = ctx.from ? (((await getPlayerByTg(ctx.from.id))?.lang as Lang) ?? "uk") : "uk";
  if (ctx.chat.type === "private") {
    await ctx.reply(tr(actorLang, "sethere_group_only"));
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
    await ctx.reply(tr(actorLang, "not_admin_group"));
    return;
  }
  const threadId = ctx.message?.message_thread_id;
  await setSetting("announce_chat_id", String(ctx.chat.id));
  await setSetting("announce_thread_id", threadId ? String(threadId) : "");
  // Без thread_id → це головна тема «General» форуму (її повідомлення без thread_id).
  await setSetting("announce_guard_general", threadId ? "false" : "true");
  if (threadId) {
    await ctx.reply(tr(actorLang, "sethere_ok_topic", { chat: ctx.chat.id, thread: threadId }));
  } else {
    await ctx.reply(tr(actorLang, "sethere_ok_general", { chat: ctx.chat.id }));
  }
});

// Прив'язка адмін-групи (другої, закритої) для чек-листів підготовки до гри (Етап 13).
// Виконати в потрібній групі/топіку — далі при анонсі гри сюди летить інтерактивний список.
bot.command("setchores", async (ctx) => {
  const actorLang = ctx.from ? (((await getPlayerByTg(ctx.from.id))?.lang as Lang) ?? "uk") : "uk";
  if (ctx.chat.type === "private") {
    await ctx.reply(tr(actorLang, "setchores_group_only"));
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
    await ctx.reply(tr(actorLang, "not_admin_group"));
    return;
  }
  const threadId = ctx.message?.message_thread_id;
  await setSetting("chores_chat_id", String(ctx.chat.id));
  await setSetting("chores_thread_id", threadId ? String(threadId) : "");
  await ctx.reply(
    tr(actorLang, "setchores_ok", {
      chat: ctx.chat.id,
      thread: threadId ? `\nthread_id: ${threadId}` : "",
    }),
  );
});

// Прив'язка гілки «тільки медіа»: лишаємо фото/відео/документ, текстові — видаляємо.
// Виконати в потрібному топіку (або в General) від імені адміна групи.
bot.command("setmedia", async (ctx) => {
  const actorLang = ctx.from ? (((await getPlayerByTg(ctx.from.id))?.lang as Lang) ?? "uk") : "uk";
  if (ctx.chat.type === "private") {
    await ctx.reply(tr(actorLang, "sethere_group_only"));
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
    await ctx.reply(tr(actorLang, "not_admin_group"));
    return;
  }
  const threadId = ctx.message?.message_thread_id;
  await setSetting("media_chat_id", String(ctx.chat.id));
  await setSetting("media_thread_id", threadId ? String(threadId) : "");
  // Без thread_id → це головна тема «General» форуму (її повідомлення без thread_id).
  await setSetting("media_guard_general", threadId ? "false" : "true");
  if (threadId) {
    await ctx.reply(tr(actorLang, "setmedia_ok_topic", { chat: ctx.chat.id, thread: threadId }));
  } else {
    await ctx.reply(tr(actorLang, "setmedia_ok_general", { chat: ctx.chat.id }));
  }
});

// Прив'язка топіка «Zdjęcia i filmy z gier / Фото та відео з ігор» для нарахування балів
// за фото-пост (Етап 32). Виконати в потрібному топіку від імені адміна групи.
bot.command("setphotos", async (ctx) => {
  const actorLang = ctx.from ? (((await getPlayerByTg(ctx.from.id))?.lang as Lang) ?? "uk") : "uk";
  if (ctx.chat.type === "private") {
    await ctx.reply(tr(actorLang, "sethere_group_only"));
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
    await ctx.reply(tr(actorLang, "not_admin_group"));
    return;
  }
  const threadId = ctx.message?.message_thread_id;
  await setSetting("photos_chat_id", String(ctx.chat.id));
  await setSetting("photos_thread_id", threadId ? String(threadId) : "");
  // Без thread_id → головна тема «General» форуму (її повідомлення без thread_id).
  await setSetting("photos_guard_general", threadId ? "false" : "true");
  if (threadId) {
    await ctx.reply(tr(actorLang, "setphotos_ok_topic", { chat: ctx.chat.id, thread: threadId }));
  } else {
    await ctx.reply(tr(actorLang, "setphotos_ok_general", { chat: ctx.chat.id }));
  }
});

// Прив'язка гілки «Флуд/Zalew» для щоденного нагадування про реєстрацію (Етап 27).
// Виконати в потрібному топіку від імені адміна групи (flood_chat_id/flood_thread_id).
// Поки не задано — щоденне нагадування інертне.
bot.command("setflood", async (ctx) => {
  const actorLang = ctx.from ? (((await getPlayerByTg(ctx.from.id))?.lang as Lang) ?? "uk") : "uk";
  if (ctx.chat.type === "private") {
    await ctx.reply(tr(actorLang, "sethere_group_only"));
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
    await ctx.reply(tr(actorLang, "not_admin_group"));
    return;
  }
  const threadId = ctx.message?.message_thread_id;
  await setSetting("flood_chat_id", String(ctx.chat.id));
  await setSetting("flood_thread_id", threadId ? String(threadId) : "");
  await ctx.reply(
    tr(actorLang, "setflood_ok", {
      chat: ctx.chat.id,
      thread: threadId ? `\nthread_id: ${threadId}` : "",
    }),
  );
});

// Прив'язка гілки «Барахолка»: лише фото з описом; публікація на сайт — з тегом #promo + патч.
bot.command("setsales", async (ctx) => {
  const actorLang = ctx.from ? (((await getPlayerByTg(ctx.from.id))?.lang as Lang) ?? "uk") : "uk";
  if (ctx.chat.type === "private") {
    await ctx.reply(tr(actorLang, "sethere_group_only"));
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
    await ctx.reply(tr(actorLang, "not_admin_group"));
    return;
  }
  const threadId = ctx.message?.message_thread_id;
  await setSetting("sales_chat_id", String(ctx.chat.id));
  await setSetting("sales_thread_id", threadId ? String(threadId) : "");
  await setSetting("sales_guard_general", threadId ? "false" : "true");
  await ctx.reply(
    tr(actorLang, "setsales_ok", {
      chat: ctx.chat.id,
      thread: threadId ? `\nthread_id: ${threadId}` : " (General)",
    }),
  );
});

// Чи може користувач модерувати барахолку: майстер/право marketplace АБО учасник
// адмін-групи (chores_chat_id) — туди прилітає картка на апрув (Етап 28).
async function canModerateMarketplace(ctx: Context, actor: any): Promise<boolean> {
  if (actor.is_master || hasPerm(actor, "marketplace")) return true;
  const choresChat = await getSetting("chores_chat_id");
  if (choresChat && ctx.from) {
    try {
      const mem = await ctx.api.getChatMember(Number(choresChat), ctx.from.id);
      return mem.status !== "left" && mem.status !== "kicked";
    } catch {}
  }
  return false;
}

// Картка оголошення — це ФОТО (editMessageCaption); фолбек-DM — текст (editMessageText).
async function editMarketplaceCard(ctx: Context, text: string) {
  try {
    await ctx.editMessageCaption({ caption: text });
  } catch {
    try {
      await ctx.editMessageText(text);
    } catch {}
  }
}

bot.callbackQuery(/^mpok:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const actor = await ensurePlayer(ctx.from);
  if (!(await canModerateMarketplace(ctx, actor))) return;
  const al = (actor.lang as Lang) ?? "uk";
  const { data: upd } = await supabase
    .from("marketplace_listings")
    .update({ status: "approved", approved_by: actor.id, approved_at: new Date().toISOString() })
    .eq("id", Number(ctx.match[1]))
    .eq("status", "pending")
    .select("id, seller_tg_user_id")
    .maybeSingle();
  if (!upd) {
    await editMarketplaceCard(ctx, tr(al, "mp_card_done"));
    return;
  }
  await editMarketplaceCard(ctx, tr(al, "mp_card_approved", { who: actor.callsign ?? actor.name ?? "?" }));
  if (upd.seller_tg_user_id) {
    const sp = await getPlayerByTg(upd.seller_tg_user_id);
    try { await bot.api.sendMessage(upd.seller_tg_user_id, tr((sp?.lang as Lang) ?? "uk", "mp_you_approved")); } catch {}
  }
});

bot.callbackQuery(/^mpno:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const actor = await ensurePlayer(ctx.from);
  if (!(await canModerateMarketplace(ctx, actor))) return;
  const al = (actor.lang as Lang) ?? "uk";
  const { data: upd } = await supabase
    .from("marketplace_listings")
    .update({ status: "rejected" })
    .eq("id", Number(ctx.match[1]))
    .eq("status", "pending")
    .select("id, storage_paths, seller_tg_user_id")
    .maybeSingle();
  if (!upd) {
    await editMarketplaceCard(ctx, tr(al, "mp_card_done"));
    return;
  }
  const bucket = (await getSetting("marketplace_bucket")) || "marketplace";
  if (upd.storage_paths?.length) {
    try { await supabase.storage.from(bucket).remove(upd.storage_paths); } catch {}
  }
  await editMarketplaceCard(ctx, tr(al, "mp_card_rejected", { who: actor.callsign ?? actor.name ?? "?" }));
  if (upd.seller_tg_user_id) {
    const sp = await getPlayerByTg(upd.seller_tg_user_id);
    try { await bot.api.sendMessage(upd.seller_tg_user_id, tr((sp?.lang as Lang) ?? "uk", "mp_you_rejected")); } catch {}
  }
});

// Тогл пункту чек-листа: вільно → взяв; мій → звільнив; чужий → «вже взяв …».
bot.callbackQuery(/^chore:(\d+)$/, async (ctx) => {
  const itemId = Number(ctx.match[1]);
  const from = ctx.from!;
  const fullName = [from.first_name, from.last_name].filter(Boolean).join(" ") || `id${from.id}`;
  const display = from.username ? `${fullName} (@${from.username})` : fullName;
  const res = await toggleChoreClaim(itemId, from.id, display);
  if (res.result === "busy") {
    await ctx.answerCallbackQuery({ text: `Вже взяв: ${res.busyName ?? "інший учасник"}` });
  } else if (res.result === "closed") {
    await ctx.answerCallbackQuery({ text: "Список уже закрито." });
  } else if (res.result === "gone") {
    await ctx.answerCallbackQuery();
  } else {
    await ctx.answerCallbackQuery({ text: res.result === "taken" ? "Взяв ✅" : "Звільнив ⬜" });
    if (res.runId) await refreshChoreMessage(ctx.api, res.runId);
  }
});

// Діагностика чек-листа: чому при анонсі не летить список. Виконати в приваті з ботом.
bot.command("choresdiag", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  if (!p.is_master && !p.is_admin) {
    await ctx.reply(tr(p.lang as Lang, "not_admin"));
    return;
  }
  const out: string[] = ["🔎 Діагностика чек-листа:"];

  const feat = await getSetting("feature_chores");
  const featOn = feat === null ? true : feat !== "false";
  out.push(`• feature_chores: ${feat ?? "(не задано)"} → ${featOn ? "✅ увімкнено" : "❌ ВИМКНЕНО"}`);

  const chatId = await getSetting("chores_chat_id");
  const threadId = await getSetting("chores_thread_id");
  out.push(`• chores_chat_id: ${chatId ?? "❌ НЕ ЗАДАНО (зроби /setchores)"}`);
  out.push(`• chores_thread_id: ${threadId || "(немає, ок)"}`);

  // Та сама вибірка, що й у реальному коді (впаде, якщо нема таблиці/колонки note).
  const { data: tpl, error: tErr } = await supabase
    .from("chore_templates")
    .select("kind, label, note, sort_order")
    .eq("active", true);
  if (tErr) out.push(`• chore_templates: ❌ ПОМИЛКА — ${tErr.message} (перевір etap13.sql)`);
  else out.push(`• chore_templates (активних): ${tpl?.length ?? 0}${(tpl?.length ?? 0) ? " ✅" : " ❌ порожньо"}`);

  const { error: rErr } = await supabase.from("chore_runs").select("id").limit(1);
  if (rErr) out.push(`• chore_runs: ❌ ПОМИЛКА — ${rErr.message}`);

  if (chatId) {
    try {
      await ctx.api.sendMessage(
        Number(chatId),
        "🧪 Тест: бот може писати в цю групу (чек-лист). Це повідомлення можна видалити.",
        { ...(threadId ? { message_thread_id: Number(threadId) } : {}) },
      );
      out.push("• Тест-надсилання в групу: ✅ дійшло");
    } catch (e: any) {
      out.push(`• Тест-надсилання в групу: ❌ ${e?.description ?? e?.message ?? String(e)}`);
    }
  }

  await ctx.reply(out.join("\n"));
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
    .select("id, callsign, name, games_played, has_patch, tg_user_id, lang")
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
    hasPatch: !!target?.has_patch,
  });
  // Якщо гравця вже позначили як неявку — повертаємо в registered.
  await supabase
    .from("registrations")
    .update({ status: "registered" })
    .eq("game_id", gameId)
    .eq("player_id", playerId);
  await ctx.editMessageText(tr(lang, "mc_done", { who }));
  await grantCheckinAchievements({
    playerId,
    gameId,
    gamesPlayedAfter: (target?.games_played ?? 0) + 1,
    hasPatch: !!target?.has_patch,
    earlyMinutes: null,
  });
  if (target) await confirmReferral(target, gameId, (target.games_played ?? 0) + 1);
});

// ─────────────────────────── Патч (членство) ───────────────────────────

bot.command("patch", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!(await featureEnabled("patch"))) {
    await ctx.reply(tr(lang, "patch_off"));
    return;
  }
  if (p.has_patch) {
    await ctx.reply(tr(lang, "patch_status_have"));
    return;
  }
  const { data: open } = await supabase
    .from("patch_requests")
    .select("status")
    .eq("player_id", p.id)
    .in("status", ["requested", "approved"])
    .order("id", { ascending: false })
    .maybeSingle();
  if (open?.status === "requested") {
    await ctx.reply(tr(lang, "patch_pending"));
    return;
  }
  if (open?.status === "approved") {
    await ctx.reply(tr(lang, "patch_approved_waiting"));
    return;
  }
  const price = await getSetting("patch_price_zl");
  // Той самий опис, що й у кабінеті на сайті: адмін-текст patch_msg_* або дефолт patch_benefits.
  let msg = (await getSetting(`patch_msg_${lang}`)) || tr(lang, "patch_benefits");
  if (price) msg += "\n\n" + tr(lang, "patch_price_line", { price });
  const kb = new InlineKeyboard().text(tr(lang, "btn_patch_request"), "patchreq");
  await ctx.reply(msg, { reply_markup: kb });
});

// Крок 1 натискання: показуємо детальне пояснення (донат, бонуси, ціна) + кнопку
// «Підтвердити запит». Заявка НЕ створюється і адмін НЕ сповіщається — лише на patchconfirm.
bot.callbackQuery("patchreq", async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  if (p.has_patch) {
    await ctx.editMessageText(tr(lang, "patch_status_have"));
    return;
  }
  const { data: open } = await supabase
    .from("patch_requests")
    .select("id, status")
    .eq("player_id", p.id)
    .in("status", ["requested", "approved"])
    .maybeSingle();
  if (open) {
    await ctx.editMessageText(
      open.status === "approved" ? tr(lang, "patch_approved_waiting") : tr(lang, "patch_pending"),
    );
    return;
  }
  // Опис уже показано на кроці /patch (як на сайті) — тут лише коротке прохання підтвердити.
  const msg = tr(lang, "patch_confirm_hint");
  const kb = new InlineKeyboard().text(tr(lang, "btn_patch_confirm"), "patchconfirm");
  await ctx.editMessageText(msg, { reply_markup: kb });
});

// Крок 2 (повторне натискання): тут реально створюємо заявку та сповіщаємо адмінів.
bot.callbackQuery("patchconfirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  if (p.has_patch) {
    await ctx.editMessageText(tr(lang, "patch_status_have"));
    return;
  }
  const { data: open } = await supabase
    .from("patch_requests")
    .select("id, status")
    .eq("player_id", p.id)
    .in("status", ["requested", "approved"])
    .maybeSingle();
  if (open) {
    await ctx.editMessageText(
      open.status === "approved" ? tr(lang, "patch_approved_waiting") : tr(lang, "patch_pending"),
    );
    return;
  }
  const { data: reqRow, error } = await supabase
    .from("patch_requests")
    .insert({ player_id: p.id, status: "requested" })
    .select("id")
    .single();
  if (error || !reqRow) {
    // 23505 (унікальний індекс) = гонка/подвійне натискання: відкрита заявка вже є.
    await ctx.editMessageText(tr(lang, "patch_pending"));
    return;
  }
  await ctx.editMessageText(tr(lang, "patch_request_sent"));

  const who = p.callsign ?? p.name ?? "?";
  const admins = await getAdminsWithPerm("patch");
  for (const a of admins) {
    if (!a.tg_user_id) continue;
    const al = (a.lang as Lang) ?? "uk";
    const kb = new InlineKeyboard()
      .text(tr(al, "btn_approve"), `patchok:${reqRow.id}`)
      .text(tr(al, "btn_reject"), `patchno:${reqRow.id}`);
    try {
      await bot.api.sendMessage(a.tg_user_id, tr(al, "patch_admin_notify", { who }), {
        reply_markup: kb,
      });
    } catch {}
  }
});

// Окремий запит гравця замість вкладеного embed: patch_requests має ДВА FK на players
// (player_id і decided_by), тож "players(...)" неоднозначний і запит падає.
async function loadPatchReq(id: number) {
  const { data: req } = await supabase
    .from("patch_requests")
    .select("id, status, player_id")
    .eq("id", id)
    .single();
  if (!req) return null;
  const { data: player } = await supabase
    .from("players")
    .select("id, callsign, name, lang, tg_user_id, rank")
    .eq("id", req.player_id)
    .single();
  return { ...req, players: player };
}

bot.callbackQuery(/^patchok:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const admin = await ensurePlayer(ctx.from);
  const al = admin.lang as Lang;
  if (!hasPerm(admin, "patch")) return;
  const req = await loadPatchReq(Number(ctx.match[1]));
  if (!req) return;
  if (req.status !== "requested") {
    await ctx.editMessageText(tr(al, "patch_already_handled"));
    return;
  }
  await supabase
    .from("patch_requests")
    .update({ status: "approved", decided_by: admin.id, decided_at: new Date().toISOString() })
    .eq("id", req.id);
  const target = (req as any).players;
  const who = target?.callsign ?? target?.name ?? "?";
  const kb = new InlineKeyboard().text(tr(al, "btn_handed"), `patchhand:${req.id}`);
  await ctx.editMessageText(tr(al, "patch_admin_approved", { who }), { reply_markup: kb });
  if (target?.tg_user_id) {
    try {
      await bot.api.sendMessage(target.tg_user_id, tr((target.lang as Lang) ?? "uk", "patch_you_approved"));
    } catch {}
  }
});

bot.callbackQuery(/^patchno:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const admin = await ensurePlayer(ctx.from);
  const al = admin.lang as Lang;
  if (!hasPerm(admin, "patch")) return;
  const req = await loadPatchReq(Number(ctx.match[1]));
  if (!req) return;
  if (req.status !== "requested") {
    await ctx.editMessageText(tr(al, "patch_already_handled"));
    return;
  }
  await supabase
    .from("patch_requests")
    .update({ status: "rejected", decided_by: admin.id, decided_at: new Date().toISOString() })
    .eq("id", req.id);
  const target = (req as any).players;
  const who = target?.callsign ?? target?.name ?? "?";
  await ctx.editMessageText(tr(al, "patch_admin_rejected", { who }));
  if (target?.tg_user_id) {
    try {
      await bot.api.sendMessage(target.tg_user_id, tr((target.lang as Lang) ?? "uk", "patch_you_rejected"));
    } catch {}
  }
});

bot.callbackQuery(/^patchhand:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const admin = await ensurePlayer(ctx.from);
  const al = admin.lang as Lang;
  if (!hasPerm(admin, "patch")) return;
  const req = await loadPatchReq(Number(ctx.match[1]));
  if (!req) return;
  if (req.status !== "approved") {
    await ctx.editMessageText(tr(al, "patch_already_handled"));
    return;
  }
  const target = (req as any).players;
  await supabase
    .from("patch_requests")
    .update({ status: "handed", decided_by: admin.id, decided_at: new Date().toISOString() })
    .eq("id", req.id);
  await supabase
    .from("players")
    .update({ has_patch: true, rank: target?.rank ?? "Recruit", patch_at: new Date().toISOString() })
    .eq("id", req.player_id);
  const who = target?.callsign ?? target?.name ?? "?";
  await ctx.editMessageText(tr(al, "patch_admin_handed", { who }));
  if (target?.tg_user_id) {
    try {
      await bot.api.sendMessage(target.tg_user_id, tr((target.lang as Lang) ?? "uk", "patch_you_handed"));
    } catch {}
  }
});

// ─────────────────────────────── Ранги ───────────────────────────────

bot.command("rank", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!(await featureEnabled("economy"))) {
    await ctx.reply(tr(lang, "econ_off"));
    return;
  }
  const balance = p.points_balance ?? 0;
  if (!p.has_patch) {
    await ctx.reply(tr(lang, "rank_need_patch", { balance }));
    return;
  }
  const current = p.rank ?? "Recruit";
  const next = nextRank(current);
  if (!next) {
    await ctx.reply(tr(lang, "rank_max", { rank: current, balance }));
    return;
  }
  const cost = await getPointValue(RANK_COST_KEY[next], RANK_COST_FALLBACK[next]);
  let msg = tr(lang, "rank_with_next", { rank: current, balance, next, cost });
  if (balance >= cost) {
    const kb = new InlineKeyboard().text(tr(lang, "btn_buy_rank", { next, cost }), "buyrank");
    await ctx.reply(msg, { reply_markup: kb });
  } else {
    msg += "\n" + tr(lang, "rank_not_enough", { need: cost - balance, next });
    await ctx.reply(msg);
  }
});

bot.callbackQuery("buyrank", async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  if (!(await featureEnabled("economy"))) {
    await ctx.editMessageText(tr(lang, "econ_off"));
    return;
  }
  const balance = p.points_balance ?? 0;
  if (!p.has_patch) {
    await ctx.editMessageText(tr(lang, "rank_need_patch", { balance }));
    return;
  }
  const current = p.rank ?? "Recruit";
  const next = nextRank(current);
  if (!next) {
    await ctx.editMessageText(tr(lang, "rank_max", { rank: current, balance }));
    return;
  }
  const cost = await getPointValue(RANK_COST_KEY[next], RANK_COST_FALLBACK[next]);
  if (balance < cost) {
    await ctx.editMessageText(tr(lang, "rank_not_enough", { need: cost - balance, next }));
    return;
  }
  const newBalance = balance - cost;
  // Атомарне підвищення: умовний UPDATE по балансу І поточному рангу (захист від гонки
  // подвійного тапу / double-spend — рядок зміниться лише якщо ранг досі = current і
  // балансу вистачає). Журнал списання — лише після успіху.
  let upd = supabase
    .from("players")
    .update({ points_balance: newBalance, rank: next })
    .eq("id", p.id)
    .gte("points_balance", cost);
  upd = p.rank == null ? upd.is("rank", null) : upd.eq("rank", p.rank);
  const { data: changed } = await upd.select("id").maybeSingle();
  if (!changed) {
    await ctx.editMessageText(tr(lang, "rank_changed"));
    return;
  }
  await supabase
    .from("point_log")
    .insert({ player_id: p.id, delta: -cost, reason: "rank_purchase", meta: next });
  await ctx.editMessageText(tr(lang, "rank_bought", { rank: next, balance: newBalance }));
});

// ───────────────────────────── Зміна позивного ─────────────────────────────
// Аналог магазину на сайті: Squad Leader+ — безкоштовно, решта — за settings.callsign_change_cost.
bot.command("callsign", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const p = await ensurePlayer(ctx.from!);
  const lang = p.lang as Lang;
  if (!(await featureEnabled("shop"))) {
    await ctx.reply(tr(lang, "callsign_change_off"));
    return;
  }
  if (!p.callsign) {
    await ctx.reply(tr(lang, "callsign_change_need_first"));
    return;
  }
  const free = !!p.has_patch && callsignChangeIsFree(p.rank ?? null);
  const cost = free ? 0 : await getPointValue(CALLSIGN_CHANGE_COST_KEY, CALLSIGN_CHANGE_COST_FALLBACK);
  const balance = p.points_balance ?? 0;
  if (!free && balance < cost) {
    await ctx.reply(tr(lang, "callsign_change_not_enough", { cost, balance }));
    return;
  }
  await setState(ctx.from!.id, "change_callsign", {});
  await ctx.reply(
    free ? tr(lang, "callsign_change_ask_free") : tr(lang, "callsign_change_ask", { cost }),
  );
});

// ───────────────────────────── Callback queries ─────────────────────────────

bot.callbackQuery(/^lang:(pl|en|uk)$/, async (ctx) => {
  const lang = ctx.match[1] as Lang;
  await ensurePlayer(ctx.from);
  await setPlayerLang(ctx.from.id, lang);
  // Меню бота для цього користувача — мовою його вибору (scope chat має пріоритет над дефолтом).
  try {
    await ctx.api.setMyCommands(playerCommands(lang), {
      scope: { type: "chat", chat_id: ctx.from.id },
    });
  } catch {}
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

// Підтвердження позивного при реєстрації (крок reg_callsign_confirm). Тільки тут пишемо
// в БД — позивний незмінний після встановлення (далі змінюється лише через /callsign у магазині).
bot.callbackQuery("csconfirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_callsign_confirm" || !data.callsign) return;
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  const callsign = String(data.callsign);
  // Повторна перевірка унікальності (могли зайняти між кроками).
  const { data: taken } = await supabase
    .from("players")
    .select("id")
    .ilike("callsign", callsign)
    .neq("id", p.id)
    .maybeSingle();
  if (taken) {
    await setState(ctx.from.id, "reg_callsign", { gameId: data.gameId });
    await ctx.editMessageText(tr(lang, "callsign_taken"));
    return;
  }
  await supabase.from("players").update({ callsign }).eq("id", p.id);
  await ctx.editMessageText(tr(lang, "callsign_set", { callsign }));
  await startRegFlow(ctx, lang, data.gameId);
});

bot.callbackQuery("cscancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_callsign_confirm") return;
  const lang = ((await getPlayerByTg(ctx.from.id))?.lang as Lang) ?? "uk";
  // Назад до вводу позивного — нехай впише інший.
  await setState(ctx.from.id, "reg_callsign", { gameId: data.gameId });
  await ctx.editMessageText(tr(lang, "callsign_cancelled"));
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
    .text(tr(lang, "btn_transport_need"), "regtr:need")
    .row()
    .text(tr(lang, "btn_transport_skip"), "regtr:skip");
  await ctx.editMessageText(tr(lang, "reg_transport_q"), { reply_markup: kb });
});

bot.callbackQuery(/^regtr:(own|need|skip)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_transport") return;
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  // Пропустити — не водій і транспорт не потрібен: завершуємо без даних про дорогу.
  if (ctx.match[1] === "skip") {
    await ctx.editMessageText(tr(lang, "transport_skip_noted"));
    await finalizeReg(ctx, p, { ...data, transport: null });
    return;
  }
  if (ctx.match[1] === "need") {
    await ctx.editMessageText(tr(lang, "transport_need_noted"));
    await finalizeReg(ctx, p, { ...data, transport: "need" });
    return;
  }
  // Тільки пін: текст «звідки» не питаємо. Спершу ціна → місця → локації (виїзд + зупинки).
  await setState(ctx.from.id, "reg_price", { ...data, transport: "own" });
  await ctx.editMessageText(tr(lang, "reg_price_q"));
});

bot.callbackQuery(/^regseats:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_seats") return;
  const p = await ensurePlayer(ctx.from);
  const lang = p.lang as Lang;
  // Останній крок реєстрації водія — точка виїзду (пін). Можна пропустити (додати в /myride).
  await setState(ctx.from.id, "reg_pin", { ...data, freeSeats: Number(ctx.match[1]), pickups: [] });
  await ctx.editMessageText(tr(lang, "reg_pin_q"), {
    reply_markup: new InlineKeyboard().text(tr(lang, "btn_reg_done"), "regdone"),
  });
});

// «Готово» — завершуємо реєстрацію з тим, що зібрали (виїзд + зупинки, або без піна).
bot.callbackQuery("regdone", async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_pin") return;
  const p = await ensurePlayer(ctx.from);
  await finalizeReg(ctx, p, data);
});

// Пропустити коментар → одразу до кроку «місця».
bot.callbackQuery("regnoteskip", async (ctx) => {
  await ctx.answerCallbackQuery();
  const { state, data } = await getState(ctx.from.id);
  if (state !== "reg_note") return;
  const p = await ensurePlayer(ctx.from);
  const kb = new InlineKeyboard()
    .text("0", "regseats:0")
    .text("1", "regseats:1")
    .text("2", "regseats:2")
    .text("3", "regseats:3");
  await setState(ctx.from.id, "reg_seats", { ...data });
  await ctx.editMessageText(tr(p.lang as Lang, "reg_seats_q"), { reply_markup: kb });
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
  // Карпул (Етап 34): якщо знявся водій — скасовуємо його брони й сповіщаємо пасажирів.
  await cancelDriverRideRequests(gameId, p.id);
  await updateAnnouncement(gameId);
  // Оновлюємо картку на місці — кнопка перемикається «Відписатись» → «Записатись».
  const card = await buildGameCard(p, gameId);
  if (card) {
    try {
      await ctx.editMessageText(card.text, { reply_markup: card.kb });
    } catch (e) {
      console.error("refresh card after unreg failed", e);
    }
  }
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
    await ctx.api.sendMessage(req.user_chat_id, await buildCaptchaText(a, b), { reply_markup: kb });
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
    await ctx.editMessageText(await buildExpiredText());
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
    await recordMemberSeen(userId); // пройшов капчу → у групі
    await ctx.editMessageText(await buildCorrectText());

    const p = await ensurePlayer(ctx.from);
    if (await featureEnabled("onboarding_faq")) {
      try {
        await ctx.api.sendMessage(ch.user_chat_id, await getFaqText(p.lang as Lang));
      } catch {}
    }
    // Завжди пропонуємо вибрати мову після успішної капчі.
    try {
      const langKb = new InlineKeyboard()
        .text("🇵🇱 Polski", "lang:pl")
        .text("🇬🇧 English", "lang:en")
        .text("🇺🇦 Українська", "lang:uk");
      await ctx.api.sendMessage(
        ch.user_chat_id,
        "🇵🇱 Wybierz język bota\n🇬🇧 Choose your bot language\n🇺🇦 Обери мову бота",
        { reply_markup: langKb },
      );
    } catch {}
  } else {
    try {
      await ctx.api.declineChatJoinRequest(ch.chat_id, userId);
    } catch {}
    await supabase.from("join_challenges").update({ status: "failed" }).eq("id", ch.id);
    await ctx.editMessageText(await buildWrongText());
  }

  await ctx.answerCallbackQuery();
});

// ─────────────────────── Диспетчер покрокових діалогів ───────────────────────

bot.on("message:location", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const { state, data } = await getState(ctx.from!.id);
  if (
    state !== "loc_pin" &&
    state !== "checkin" &&
    state !== "ride_pin" &&
    state !== "reg_pin"
  )
    return;
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

  // Карпул: водій ставить точку виїзду з /myride (ті самі колонки from_lat/from_lng, що пише сайт).
  if (state === "ride_pin") {
    const { data: prev } = await supabase
      .from("registrations")
      .select("from_lat")
      .eq("game_id", data.gameId)
      .eq("player_id", p.id)
      .maybeSingle();
    await supabase
      .from("registrations")
      .update({ from_lat: loc.latitude, from_lng: loc.longitude })
      .eq("game_id", data.gameId)
      .eq("player_id", p.id);
    await clearState(ctx.from!.id);
    await ctx.reply(tr(p.lang as Lang, "ride_pin_saved"));
    // Перший пін → водій став активним: анонімно сповіщаємо шукачів авто.
    if (prev?.from_lat == null) await announceDriverToSeekers(data.gameId, p.id);
    return;
  }

  // Карпул-реєстрація: 1-й пін — точка виїзду, кожен наступний — зупинка (до 4). «Готово» завершує.
  if (state === "reg_pin") {
    const rlang = p.lang as Lang;
    const doneKb = new InlineKeyboard().text(tr(rlang, "btn_reg_done"), "regdone");
    if (data.lat == null) {
      await setState(ctx.from!.id, "reg_pin", { ...data, lat: loc.latitude, lng: loc.longitude });
      await ctx.reply(tr(rlang, "reg_pin_departure_saved"), { reply_markup: doneKb });
      return;
    }
    const pickups: { lat: number; lng: number }[] = Array.isArray(data.pickups) ? data.pickups : [];
    if (pickups.length >= 4) {
      await ctx.reply(tr(rlang, "reg_pin_max"), { reply_markup: doneKb });
      return;
    }
    const next = [...pickups, { lat: loc.latitude, lng: loc.longitude }];
    await setState(ctx.from!.id, "reg_pin", { ...data, pickups: next });
    await ctx.reply(tr(rlang, "reg_pin_stop_added", { n: next.length }), { reply_markup: doneKb });
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

  // ── реєстрація: позивний (ставиться один раз → крок підтвердження) ──
  // Також ловимо reg_callsign_confirm: якщо гравець ВПИСАВ інший позивний замість кнопки —
  // перевіряємо новий і знову показуємо підтвердження (а не ігноруємо повідомлення).
  if (state === "reg_callsign" || state === "reg_callsign_confirm") {
    const v = normalizeCallsign(text);
    if (!v.ok) {
      await ctx.reply(tr(lang, "callsign_bad"));
      return;
    }
    const callsign = v.value;
    // Унікальність без урахування регістру (як на сайті), виключаючи себе.
    const { data: taken } = await supabase
      .from("players")
      .select("id")
      .ilike("callsign", callsign)
      .neq("id", p.id)
      .maybeSingle();
    if (taken) {
      await ctx.reply(tr(lang, "callsign_taken"));
      return;
    }
    // НЕ пишемо одразу — спершу підтвердження (позивний незмінний після встановлення).
    // Сам позивний тримаємо в state.data (поза callback_data, під лімітом 64 байти).
    await setState(ctx.from!.id, "reg_callsign_confirm", { ...data, callsign });
    const kb = new InlineKeyboard()
      .text(tr(lang, "btn_callsign_confirm"), "csconfirm")
      .row()
      .text(tr(lang, "btn_callsign_cancel"), "cscancel");
    await ctx.reply(tr(lang, "callsign_confirm_q", { callsign }), { reply_markup: kb });
    return;
  }
  if (state === "reg_price") {
    const price = parseInt(text, 10);
    if (isNaN(price) || price < 0 || price > 1000) {
      await ctx.reply(tr(lang, "reg_price_bad"));
      return;
    }
    await setState(ctx.from!.id, "reg_note", { ...data, price });
    await ctx.reply(tr(lang, "reg_note_q"), {
      reply_markup: new InlineKeyboard().text(tr(lang, "btn_skip"), "regnoteskip"),
    });
    return;
  }
  if (state === "reg_note") {
    await setState(ctx.from!.id, "reg_seats", { ...data, note: text.slice(0, 80) });
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
    await setState(ctx.from!.id, "reg_pin", { ...data, freeSeats: seats, pickups: [] });
    await ctx.reply(tr(lang, "reg_pin_q"), {
      reply_markup: new InlineKeyboard().text(tr(lang, "btn_reg_done"), "regdone"),
    });
    return;
  }
  if (state === "reg_pin") {
    // Тут чекаємо ЛОКАЦІЮ (виїзд / зупинки) або «Готово». Текст → повторюємо підказку.
    await ctx.reply(tr(lang, "reg_pin_q"), {
      reply_markup: new InlineKeyboard().text(tr(lang, "btn_reg_done"), "regdone"),
    });
    return;
  }

  // ── зміна позивного за бали (/callsign) ──
  if (state === "change_callsign") {
    const v = normalizeCallsign(text);
    if (!v.ok) {
      await ctx.reply(tr(lang, "callsign_bad"));
      return;
    }
    const callsign = v.value;
    if (p.callsign && callsign.toLowerCase() === String(p.callsign).toLowerCase()) {
      await ctx.reply(tr(lang, "callsign_change_same"));
      return;
    }
    const { data: taken } = await supabase
      .from("players")
      .select("id")
      .ilike("callsign", callsign)
      .neq("id", p.id)
      .maybeSingle();
    if (taken) {
      await ctx.reply(tr(lang, "callsign_taken"));
      return;
    }
    const free = !!p.has_patch && callsignChangeIsFree(p.rank ?? null);
    const cost = free ? 0 : await getPointValue(CALLSIGN_CHANGE_COST_KEY, CALLSIGN_CHANGE_COST_FALLBACK);
    if (cost > 0) {
      const balance = p.points_balance ?? 0;
      if (balance < cost) {
        await clearState(ctx.from!.id);
        await ctx.reply(tr(lang, "callsign_change_not_enough", { cost, balance }));
        return;
      }
      // Атомарне перейменування+списання (як buyRank); UNIQUE-колізія → callsign_taken.
      const { data: changed, error } = await supabase
        .from("players")
        .update({ points_balance: balance - cost, callsign })
        .eq("id", p.id)
        .gte("points_balance", cost)
        .select("id")
        .maybeSingle();
      if (error) {
        await ctx.reply(tr(lang, "callsign_taken"));
        return;
      }
      if (!changed) {
        await clearState(ctx.from!.id);
        await ctx.reply(tr(lang, "callsign_change_not_enough", { cost, balance }));
        return;
      }
      await supabase
        .from("point_log")
        .insert({ player_id: p.id, delta: -cost, reason: "callsign_change", meta: callsign });
    } else {
      const { error } = await supabase.from("players").update({ callsign }).eq("id", p.id);
      if (error) {
        await ctx.reply(tr(lang, "callsign_taken"));
        return;
      }
    }
    await clearState(ctx.from!.id);
    await ctx.reply(tr(lang, "callsign_change_done", { callsign }));
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
  const earlyMin = Math.floor((now - new Date(game.checkin_from).getTime()) / 60000);
  await grantCheckinAchievements({
    playerId: p.id,
    gameId,
    gamesPlayedAfter: (p.games_played ?? 0) + 1,
    hasPatch: !!p.has_patch,
    earlyMinutes: earlyMin,
  });
  await confirmReferral(p, gameId, (p.games_played ?? 0) + 1);
}

async function finalizeGame(ctx: Context, lang: Lang, data: Record<string, any>) {
  const gatherUtc = makeUtc(data.date, data.gather);
  const startUtc = makeUtc(data.date, data.start);
  const w = computeWindows(gatherUtc, startUtc, await getCheckinWindow());
  const capacity: number | null = data.capacity ?? null;

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
    .select("id")
    .single();

  await clearState(ctx.from!.id);
  if (!game) {
    await ctx.reply(tr(lang, "gamenew_announce_failed"));
    return;
  }

  // Анонс у «Анонси» + чек-лист у адмін-групу — спільний шлях із сайтом (createGame),
  // щоб результат не залежав від способу створення гри (lib/game-announce.ts).
  const res = await announceGame(ctx.api, game.id);
  if (!res.ok) {
    await ctx.reply(tr(lang, res.reason === "no_announce_chat" ? "gamenew_no_topic" : "gamenew_announce_failed"));
    return;
  }

  await ctx.reply(
    tr(lang, "gamenew_done", {
      id: game.id,
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
  const text = appendVideoLine(
    buildAnnouncement(
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
        replicaTypes: loc.replica_types ?? [],
        pyro: loc.pyro ?? "no",
        pyroNotePl: loc.pyro_note_pl ?? null,
        pyroNoteUk: loc.pyro_note_uk ?? null,
        fireMode: loc.fire_mode ?? "semi",
        paymentPl: loc.payment_pl ?? null,
        paymentUk: loc.payment_uk ?? null,
      },
      settings,
    ),
    loc.youtube_url ?? null,
  );
  const kb = new InlineKeyboard().url(
    REG_BTN,
    `https://t.me/${bot.botInfo.username}?start=g${gameId}`,
  );
  const linkPreview = announceLinkPreview(loc.youtube_url ?? null);
  try {
    await bot.api.editMessageText(game.announce_chat_id, game.announce_message_id, text, {
      reply_markup: kb,
      ...(linkPreview ? { link_preview_options: linkPreview } : {}),
    });
  } catch (e) {
    console.error("update announcement failed", e);
  }
}

// Будує картку гри: текст + клавіатура (записатись/виписатись).
// Лічильник гравців додається лише коли увімкнено feature_announce_count (як у анонсі).
// Повертає null, якщо гри не існує.
async function buildGameCard(
  p: any,
  gameId: number,
): Promise<{ text: string; kb: InlineKeyboard } | null> {
  const lang = p.lang as Lang;
  const { data: game } = await supabase
    .from("games")
    .select("*, locations(*)")
    .eq("id", gameId)
    .single();
  if (!game) return null;
  const loc = (game as any).locations;
  const { data: reg } = await supabase
    .from("registrations")
    .select("status")
    .eq("game_id", gameId)
    .eq("player_id", p.id)
    .maybeSingle();
  const kb = new InlineKeyboard();
  if (reg?.status === "registered") kb.text(tr(lang, "btn_leave"), `unreg:${gameId}`);
  else kb.text(tr(lang, "btn_register"), `reg:${gameId}`);
  // Назва зазвичай і є локацією — показуємо одну, а локацію окремим рядком лише якщо вона інша.
  const name = game.title ?? loc?.name ?? "ASG";
  let text = tr(lang, "game_card", {
    title: name,
    when: formatWhen(game.gather_at ?? game.start_at),
  });
  if (loc?.name && loc.name !== name) {
    text += "\n" + tr(lang, "game_card_loc", { loc: loc.name });
  }
  // Лічильник гравців — вмикається/вимикається в адмінці (default ON).
  if (await featureEnabled("announce_count")) {
    text += "\n" + tr(lang, "game_card_count", { count: await registeredCount(gameId) });
  }
  // Сценарій гри (з налаштувань гри) — щоб картка була інформативнішою.
  const scenario = (lang === "pl" ? game.scenario_pl : game.scenario_uk)?.trim();
  if (scenario) {
    text += "\n\n" + scenario;
  }
  // Знижка за приведених новачків на цю гру (інфо «при оплаті»).
  const { count: refCount } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("inviter_id", p.id)
    .eq("game_id", gameId)
    .eq("status", "confirmed");
  if ((refCount ?? 0) > 0) {
    const discount = (refCount ?? 0) >= 2 ? tr(lang, "ref_disc_free") : tr(lang, "ref_disc_half");
    text += "\n" + tr(lang, "ref_card_discount", { discount });
  }
  // Чіткий статус для вже записаного гравця — над кнопкою «Відписатись».
  if (reg?.status === "registered") {
    text += "\n\n" + tr(lang, "card_already_registered");
  }
  return { text, kb };
}

async function showGameCard(ctx: Context, p: any, gameId: number) {
  const card = await buildGameCard(p, gameId);
  if (!card) {
    await ctx.reply(tr(p.lang as Lang, "game_not_found"));
    return;
  }
  await ctx.reply(card.text, { reply_markup: card.kb });
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
  const regRow: Record<string, any> = {
    game_id: gameId,
    player_id: p.id,
    status: "registered",
    needs_rental: !!data.needsRental,
    transport: data.transport ?? null,
    free_seats: data.freeSeats ?? null,
    ride_price: data.price ?? null,
    seats_closed: false,
  };
  // Пін/зупинки зберігаємо лише якщо щойно задані — інакше не чіпаємо наявні (повторна реєстрація).
  if (data.lat != null && data.lng != null) {
    regRow.from_lat = data.lat;
    regRow.from_lng = data.lng;
  }
  if (Array.isArray(data.pickups)) {
    regRow.pickups = data.pickups.length ? data.pickups : null;
  }
  if (data.transport === "own") {
    regRow.ride_note = data.note ? String(data.note).slice(0, 80) : null;
  }
  await supabase.from("registrations").upsert(regRow, { onConflict: "game_id,player_id" });
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
    await notifyAdminsRental({
      callsign: p.callsign,
      name: p.name,
      tgUserId: p.tg_user_id,
      tgUsername: p.tg_username,
      email: null,
      game,
    });
  }
  if (data.transport === "own") {
    await ctx.reply(tr(p.lang as Lang, "myride_hint"));
    // Пін при реєстрації → водій став активним: анонімно сповіщаємо шукачів авто.
    if (data.lat != null) await announceDriverToSeekers(gameId, p.id);
  }
  // Шукач авто: одразу показуємо активних водіїв (або «поки нема — напишемо, коли зголосяться»).
  if (data.transport === "need") {
    await showDrivers(ctx, p.lang as Lang, gameId, (game as any)?.title ?? null, "ride_seeker_none");
  }
}

// notifyAdminsRental переїхав у lib/notify.ts (спільний для сайту й бота, з контактом орендаря).
