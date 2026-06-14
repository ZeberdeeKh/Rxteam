import { DateTime } from "luxon";
import { supabase } from "./supabase";

const ZONE = "Europe/Warsaw";

// Парсинг введеної адміном дати/часу (локальний час Вроцлава) → DateTime.
export function parseDateTime(input: string): DateTime | null {
  const formats = ["dd.MM.yyyy HH:mm", "dd.MM HH:mm", "yyyy-MM-dd HH:mm"];
  for (const f of formats) {
    let dt = DateTime.fromFormat(input.trim(), f, { zone: ZONE });
    if (dt.isValid) {
      // якщо рік не вказано і дата вже минула — наступний рік
      if (!f.includes("yyyy") && dt < DateTime.now().setZone(ZONE)) dt = dt.plus({ years: 1 });
      return dt;
    }
  }
  return null;
}

// Вікна гри від старту (UTC ISO на вході).
export function computeWindows(startUtcIso: string) {
  const start = DateTime.fromISO(startUtcIso, { zone: "utc" });
  return {
    reg_closes_at: start.minus({ hours: 9 }).toISO()!,
    cancel_deadline: start.minus({ hours: 24 }).toISO()!,
    checkin_from: start.minus({ hours: 1 }).toISO()!,
    checkin_to: start.plus({ hours: 1 }).toISO()!,
  };
}

// UTC ISO → "dd.MM HH:mm" у часі Вроцлава.
export function formatWhen(startUtcIso: string): string {
  return DateTime.fromISO(startUtcIso, { zone: "utc" }).setZone(ZONE).toFormat("dd.MM HH:mm");
}

export async function registeredCount(gameId: number): Promise<number> {
  const { count } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId)
    .eq("status", "registered");
  return count ?? 0;
}

// Текст анонсу в групу (тримовний — це публічний пост).
export function announcementText(opts: {
  locationName: string;
  mapUrl: string | null;
  startUtcIso: string;
  count: number;
  capacity: number | null;
}): string {
  const cap = opts.capacity ? `/${opts.capacity}` : "";
  const map = opts.mapUrl ? ` — ${opts.mapUrl}` : "";
  return [
    `🎯 ASG — ${opts.locationName}`,
    `📅 ${formatWhen(opts.startUtcIso)} (Wrocław)`,
    `📍 ${opts.locationName}${map}`,
    `👥 ${opts.count}${cap}`,
    ``,
    `🇵🇱 Zapisz się przyciskiem niżej`,
    `🇬🇧 Sign up with the button below`,
    `🇺🇦 Записуйся кнопкою нижче`,
  ].join("\n");
}
