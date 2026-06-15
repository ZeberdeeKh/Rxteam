import { supabase } from "./supabase";
import { tr } from "./strings";
import type { Lang } from "./i18n";

const TG = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

async function sendTg(chatId: number, text: string) {
  try {
    await fetch(`${TG}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
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

// Telegram-id майстер-адміна (delltex). Звіти про помилки йдуть ТІЛЬКИ йому.
async function masterChatIds(): Promise<number[]> {
  const { data } = await supabase
    .from("players")
    .select("tg_user_id")
    .eq("is_master", true)
    .not("tg_user_id", "is", null);
  return (data ?? []).map((a) => a.tg_user_id as number).filter(Boolean);
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
  const text =
    `🐞 Zgłoszenie błędu / Звіт про помилку\n\n${opts.description}\n\n— context —\n${metaLines}${emailLine}`.slice(
      0,
      4096,
    );

  const ids = await masterChatIds();
  for (const id of ids) {
    await sendTg(id, text);
    if (opts.screenshot) await sendTgPhoto(id, opts.screenshot.bytes, opts.screenshot.mime);
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

  // Кожному адміну — його мовою (pl/en/uk), як у notifyAdminsRental (lib/bot.ts).
  const { data: admins } = await supabase
    .from("players")
    .select("tg_user_id, lang")
    .eq("is_admin", true)
    .not("tg_user_id", "is", null);

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
