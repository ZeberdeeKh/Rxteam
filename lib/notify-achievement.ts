import { supabase } from "./supabase";
import { tr } from "./strings";
import { getSetting } from "./settings";
import type { Lang } from "./i18n";
import type { GrantedAch } from "./economy";

const TG = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

// DM гравцю в Telegram про здобуту ачівку (мовою гравця) + посилання на свої ачівки на сайті.
// Окремий helper (raw fetch, без grammy) — щоб economy.ts лишався безпечним для server actions
// і cron і не тягнув bot.ts (циклічний імпорт). GrantedAch — type-only імпорт (стирається).
// Best-effort: НІКОЛИ не кидає; no-op якщо немає tg_user_id (веб-профіль) або бот заблоковано (403).
export async function notifyAchievement(playerId: number, ach: GrantedAch): Promise<void> {
  try {
    const { data: player } = await supabase
      .from("players")
      .select("tg_user_id, lang")
      .eq("id", playerId)
      .single();
    if (!player?.tg_user_id) return; // веб-only гравець → без DM

    const lang: Lang = (player.lang as Lang) ?? "uk";
    const title =
      lang === "pl"
        ? ach.title_pl ?? ach.title_en ?? ach.title_uk ?? ach.code
        : lang === "en"
          ? ach.title_en ?? ach.title_uk ?? ach.title_pl ?? ach.code
          : ach.title_uk ?? ach.title_en ?? ach.title_pl ?? ach.code;

    const siteUrl =
      (await getSetting("site_url")) || process.env.NEXT_PUBLIC_SITE_URL || "https://www.rxteam.pl";
    const cabUrl = `${siteUrl.replace(/\/$/, "")}/cabinet`;

    const text = tr(lang, "ach_earned_dm", { title, points: ach.points, url: cabUrl });

    await fetch(`${TG}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: player.tg_user_id, text }),
    });
  } catch {
    // ковтаємо: немає tg, заблокований бот (403), мережа — не має ламати видачу ачівки
  }
}
