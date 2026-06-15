import { supabase } from "./supabase";

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

// Сповіщення всіх адмінів про покупку в магазині.
export async function notifyAdminsPurchase(opts: {
  playerCallsign: string | null;
  playerName: string | null;
  itemTitle: string;
  cost: number;
}) {
  const who = opts.playerCallsign ?? opts.playerName ?? "?";
  const text =
    `🛒 Нова покупка в магазині!\n` +
    `👤 Гравець: ${who}\n` +
    `📦 Товар: ${opts.itemTitle}\n` +
    `💰 Вартість: ${opts.cost} балів\n\n` +
    `Потрібна ваша дія — видайте товар гравцю.`;

  const { data: admins } = await supabase
    .from("players")
    .select("tg_user_id")
    .eq("is_admin", true)
    .not("tg_user_id", "is", null);

  for (const a of admins ?? []) {
    if (a.tg_user_id) await sendTg(a.tg_user_id as number, text);
  }
}
