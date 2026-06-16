// Постинг анонсу гри в групу «Анонси» + чек-лист підготовки в адмін-групу.
// Bot-agnostic: приймає grammy `Api` (ctx.api у боті / new Api(token) у server action),
// щоб створення гри ЧЕРЕЗ БОТА (/newgame) і ЧЕРЕЗ САЙТ (createGame) давало однаковий
// результат: один анонс у «Анонси» з кнопкою реєстрації + збереження announce_*_id на
// грі (для подальшого editMessageText лічильника) + чек-лист у адмін-групу (postChoreRun).
//
// Окремий модуль (не lib/games.ts), бо lib/games.ts тягнеться в клієнтський бандл
// (лендінг, GameCard), а grammy має лишатися server-only.
import { InlineKeyboard, type Api } from "grammy";
import { supabase } from "./supabase";
import { getSetting, getAllSettings } from "./settings";
import { buildAnnouncement, registeredCount, type GameForAnnounce } from "./games";
import { postChoreRun } from "./chores";

// Кнопка реєстрації під анонсом (deep-link на картку гри). Єдине джерело правди —
// імпортується і в lib/bot.ts (updateAnnouncement).
export const REG_BTN = "✅ Записатись / Sign up";

export type AnnounceResult =
  | { ok: true }
  | { ok: false; reason: "no_announce_chat" | "send_failed" };

// Збирає вхід для buildAnnouncement з рядків games + locations (join).
function toAnnounceInput(game: any, loc: any, count: number): GameForAnnounce {
  return {
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
  };
}

// Постить анонс для ВЖЕ СТВОРЕНОЇ гри (gameId) + чек-лист підготовки. Викликається
// одразу після insert у games (бот або сайт). Чек-лист — best-effort: його збій не
// має ламати анонс (Етап 13). Повертає причину для повідомлення адміну.
export async function announceGame(api: Api, gameId: number): Promise<AnnounceResult> {
  const chatId = await getSetting("announce_chat_id");
  if (!chatId) return { ok: false, reason: "no_announce_chat" };
  const threadId = await getSetting("announce_thread_id");

  const { data: game } = await supabase
    .from("games")
    .select("*, locations(*)")
    .eq("id", gameId)
    .single();
  if (!game) return { ok: false, reason: "send_failed" };
  const loc = (game as any).locations;

  const count = await registeredCount(gameId);
  const settings = await getAllSettings();
  const text = buildAnnouncement(toAnnounceInput(game, loc, count), settings);

  const me = await api.getMe();
  const kb = new InlineKeyboard().url(REG_BTN, `https://t.me/${me.username}?start=g${gameId}`);

  try {
    const msg = await api.sendMessage(Number(chatId), text, {
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
      .eq("id", gameId);
  } catch (e) {
    console.error("announceGame: send failed", e);
    return { ok: false, reason: "send_failed" };
  }

  // Чек-лист підготовки в адмін-групу — не має ламати анонс (Етап 13).
  try {
    await postChoreRun(api, gameId);
  } catch (e) {
    console.error("announceGame: postChoreRun failed", e);
  }

  return { ok: true };
}
