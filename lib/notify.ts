import { supabase } from "./supabase";
import { tr } from "./strings";
import { formatWhen } from "./games";
import { getAdminsWithPerm } from "./players";
import type { Lang } from "./i18n";

const TG = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

async function sendTg(chatId: number, text: string, replyMarkup?: unknown) {
  try {
    await fetch(`${TG}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
  } catch {}
}

async function sendTgPhoto(chatId: number, bytes: Buffer, mime: string) {
  try {
    const ext = (mime.split("/")[1] ?? "png").replace("jpeg", "jpg");
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("photo", new Blob([new Uint8Array(bytes)], { type: mime }), `screenshot.${ext}`);
    await fetch(`${TG}/sendPhoto`, { method: "POST", body: form });
  } catch {}
}

// Telegram-id майстер-адміна (delltex) + його мова. Звіти про помилки йдуть ТІЛЬКИ йому.
async function masterChats(): Promise<{ id: number; lang: Lang }[]> {
  const { data } = await supabase
    .from("players")
    .select("tg_user_id, lang")
    .eq("is_master", true)
    .not("tg_user_id", "is", null);
  return (data ?? [])
    .filter((a) => a.tg_user_id)
    .map((a) => ({ id: a.tg_user_id as number, lang: (a.lang as Lang) ?? "uk" }));
}

// Сповіщення майстер-адміна про звіт «Повідомити про помилку».
export async function notifyAdminsBugReport(opts: {
  description: string;
  email?: string | null;
  meta?: Record<string, unknown>;
  screenshot?: { bytes: Buffer; mime: string } | null;
}) {
  const metaLines = Object.entries(opts.meta ?? {})
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
  const emailLine = opts.email ? `\n✉️ ${opts.email}` : "";

  const chats = await masterChats();
  for (const m of chats) {
    // Заголовок — мовою конкретного майстер-адміна; решта (опис, контекст) — як надіслано.
    const text =
      `${tr(m.lang, "bug_report_header")}\n\n${opts.description}\n\n— context —\n${metaLines}${emailLine}`.slice(
        0,
        4096,
      );
    await sendTg(m.id, text);
    if (opts.screenshot) await sendTgPhoto(m.id, opts.screenshot.bytes, opts.screenshot.mime);
  }
}

// Сповіщення всіх адмінів про покупку в магазині.
export async function notifyAdminsPurchase(opts: {
  playerCallsign: string | null;
  playerName: string | null;
  itemTitle: string;
  cost: number;
}) {
  const who = opts.playerCallsign ?? opts.playerName ?? "?";

  // Сповіщення про покупки — власникам дозволу "shop" (+ майстру), кожному його мовою (Етап 22).
  const admins = await getAdminsWithPerm("shop");

  for (const a of admins ?? []) {
    if (!a.tg_user_id) continue;
    const text = tr((a.lang as Lang) ?? "uk", "admin_purchase_notify", {
      who,
      item: opts.itemTitle,
      cost: opts.cost,
    });
    await sendTg(a.tg_user_id as number, text);
  }
}

// Сповіщення адмінів про запит на патч із сайту (best-effort; ті самі отримувачі, що в боті).
// Додаємо посилання на чат із гравцем + inline-кнопки підтвердження/відхилення (patchok/patchno —
// їх обробляє той самий бот за токеном, тож кнопки робочі й для DM із сайту).
export async function notifyAdminsPatchRequest(req: {
  id: number;
  who: string;
  tgUserId?: number | null;
  tgUsername?: string | null;
}) {
  const admins = await getAdminsWithPerm("patch");
  const contactLine = req.tgUsername
    ? `\n👤 https://t.me/${req.tgUsername}`
    : req.tgUserId
      ? `\n👤 tg://user?id=${req.tgUserId}`
      : "";
  for (const a of admins ?? []) {
    if (!a.tg_user_id) continue;
    const lang = (a.lang as Lang) ?? "uk";
    const text = tr(lang, "patch_admin_notify", { who: req.who }) + contactLine;
    const reply_markup = {
      inline_keyboard: [
        [
          { text: tr(lang, "btn_approve"), callback_data: `patchok:${req.id}` },
          { text: tr(lang, "btn_reject"), callback_data: `patchno:${req.id}` },
        ],
      ],
    };
    await sendTg(a.tg_user_id as number, text, reply_markup);
  }
}

// Сповіщення гравця про рішення по заявці на патч (виклик із адмінки сайту — /admin/patches).
// Ті самі тексти, що шле бот (patch_you_approved/rejected/handed). Best-effort.
export async function notifyPlayerPatch(
  tgUserId: number | null | undefined,
  lang: Lang,
  key: "patch_you_approved" | "patch_you_rejected" | "patch_you_handed",
) {
  if (!tgUserId) return;
  await sendTg(tgUserId, tr(lang, key));
}

// Сповіщення адмінів про реєстрацію з ОРЕНДОЮ (викликається і з сайту, і з бота — lib/bot.ts).
// Додає явний контакт орендаря: TG-лінк (t.me/username або tg://user?id=) чи email (сайт-юзери).
export async function notifyAdminsRental(opts: {
  callsign: string | null;
  name: string | null;
  tgUserId?: number | null;
  tgUsername?: string | null;
  email?: string | null;
  game: { title?: string | null; gather_at?: string | null; start_at?: string | null } | null;
}) {
  const who = opts.callsign ?? opts.name ?? "?";
  const whenSrc = opts.game?.gather_at ?? opts.game?.start_at ?? null;
  const when = whenSrc ? formatWhen(whenSrc) : "";

  // Контакт орендаря: TG @username → t.me; інакше tg://user?id=; інакше email.
  const contactLine = opts.tgUsername
    ? `\n👤 https://t.me/${opts.tgUsername}`
    : opts.tgUserId
      ? `\n👤 tg://user?id=${opts.tgUserId}`
      : opts.email
        ? `\n✉️ ${opts.email}`
        : "";

  // Сповіщення про оренду — власникам дозволу "rental" (+ майстру) — Етап 22.
  const admins = await getAdminsWithPerm("rental");

  for (const a of admins ?? []) {
    if (!a.tg_user_id) continue;
    const text =
      tr((a.lang as Lang) ?? "uk", "admin_rental_notify", {
        callsign: who,
        title: opts.game?.title ?? "ASG",
        when,
      }) + contactLine;
    await sendTg(a.tg_user_id as number, text);
  }
}

// ─────────────────────────── Carpool: бронювання місць (Етап 34) ───────────────────────────
// Спільні для сайту й бота. Кнопки rideok/rideno обробляє той самий бот за токеном,
// тож DM, відправлений із сайту, має робочі кнопки (як patchok/patchno).

function tgContactLine(tgUsername?: string | null, tgUserId?: number | null): string {
  return tgUsername
    ? `\n👤 https://t.me/${tgUsername}`
    : tgUserId
      ? `\n👤 tg://user?id=${tgUserId}`
      : "";
}

// DM водію: пасажир просить місце. Inline-кнопки Прийняти/Відхилити (callback rideok/rideno).
export async function notifyDriverRideRequest(opts: {
  requestId: number;
  driverTgUserId?: number | null;
  driverLang: Lang;
  passengerWho: string;
  passengerTgUserId?: number | null;
  passengerTgUsername?: string | null;
  gameTitle: string | null;
}) {
  if (!opts.driverTgUserId) return;
  const text =
    tr(opts.driverLang, "ride_request_to_driver", {
      who: opts.passengerWho,
      title: opts.gameTitle ?? "ASG",
    }) + tgContactLine(opts.passengerTgUsername, opts.passengerTgUserId);
  const reply_markup = {
    inline_keyboard: [
      [
        { text: tr(opts.driverLang, "btn_ride_accept"), callback_data: `rideok:${opts.requestId}` },
        { text: tr(opts.driverLang, "btn_ride_decline"), callback_data: `rideno:${opts.requestId}` },
      ],
    ],
  };
  await sendTg(opts.driverTgUserId, text, reply_markup);
}

// DM пасажиру: водій ПРИЙНЯВ — додаємо контакт водія для зв'язку.
export async function notifyPassengerRideAccepted(opts: {
  passengerTgUserId?: number | null;
  passengerLang: Lang;
  driverWho: string;
  driverTgUsername?: string | null;
  driverTgUserId?: number | null;
  gameTitle: string | null;
}) {
  if (!opts.passengerTgUserId) return;
  const text =
    tr(opts.passengerLang, "ride_accepted_passenger", {
      who: opts.driverWho,
      title: opts.gameTitle ?? "ASG",
    }) + tgContactLine(opts.driverTgUsername, opts.driverTgUserId);
  await sendTg(opts.passengerTgUserId, text);
}

// DM шукачу авто: з'явився активний водій на гру — АНОНІМНО (без імені водія).
// Контакт розкривається лише коли водій підтвердить запит (notifyPassengerRideAccepted).
export async function notifySeekerNewDriver(opts: {
  seekerTgUserId?: number | null;
  seekerLang: Lang;
  gameTitle: string | null;
}) {
  if (!opts.seekerTgUserId) return;
  await sendTg(opts.seekerTgUserId, tr(opts.seekerLang, "ride_new_driver", { title: opts.gameTitle ?? "ASG" }));
}

// DM пасажиру: відмова або водій знявся з гри. key обирає текст.
export async function notifyPassengerRideEnded(opts: {
  passengerTgUserId?: number | null;
  passengerLang: Lang;
  key: "ride_declined_passenger" | "ride_driver_left_passenger";
  driverWho: string;
  gameTitle: string | null;
}) {
  if (!opts.passengerTgUserId) return;
  await sendTg(
    opts.passengerTgUserId,
    tr(opts.passengerLang, opts.key, { who: opts.driverWho, title: opts.gameTitle ?? "ASG" }),
  );
}
