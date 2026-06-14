import { DateTime } from "luxon";
import { supabase } from "./supabase";

const ZONE = "Europe/Warsaw";

// Дата без часу → "yyyy-MM-dd" (час Вроцлава).
export function parseDateOnly(input: string): string | null {
  const fmts = ["dd.MM.yyyy", "dd.MM", "yyyy-MM-dd"];
  for (const f of fmts) {
    let dt = DateTime.fromFormat(input.trim(), f, { zone: ZONE });
    if (dt.isValid) {
      if (!f.includes("yyyy") && dt.endOf("day") < DateTime.now().setZone(ZONE)) {
        dt = dt.plus({ years: 1 });
      }
      return dt.toFormat("yyyy-MM-dd");
    }
  }
  return null;
}

export function validTime(input: string): string | null {
  const dt = DateTime.fromFormat(input.trim(), "HH:mm", { zone: ZONE });
  return dt.isValid ? dt.toFormat("HH:mm") : null;
}

export function makeUtc(dateYmd: string, time: string): string {
  return DateTime.fromFormat(`${dateYmd} ${time}`, "yyyy-MM-dd HH:mm", { zone: ZONE })
    .toUTC()
    .toISO()!;
}

// Вікна від часу збору (gather) і старту.
export function computeWindows(gatherUtcIso: string, startUtcIso: string) {
  const g = DateTime.fromISO(gatherUtcIso, { zone: "utc" });
  const s = DateTime.fromISO(startUtcIso, { zone: "utc" });
  return {
    reg_closes_at: g.minus({ hours: 9 }).toISO()!,
    cancel_deadline: g.minus({ hours: 24 }).toISO()!,
    checkin_from: g.minus({ minutes: 30 }).toISO()!,
    checkin_to: s.plus({ minutes: 60 }).toISO()!,
  };
}

export function formatTime(utcIso: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" }).setZone(ZONE).toFormat("HH:mm");
}

export function formatWhen(utcIso: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" }).setZone(ZONE).toFormat("dd.MM HH:mm");
}

// Відстань між двома точками в метрах (haversine).
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function registeredCount(gameId: number): Promise<number> {
  const { count } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId)
    .eq("status", "registered");
  return count ?? 0;
}

const LABELS = {
  pl: { flag: "🇵🇱", loc: "Lokalizacja", gather: "Zbiórka", start: "Start gry", qo: "„", qc: "”" },
  uk: { flag: "🇺🇦", loc: "Локація", gather: "Збір", start: "Початок гри", qo: "«", qc: "»" },
};

export type GameForAnnounce = {
  title: string | null;
  lat: number;
  lng: number;
  mapUrl: string | null;
  gatherUtc: string;
  startUtc: string;
  scenarioPl: string | null;
  scenarioUk: string | null;
  count: number;
  capacity: number | null;
};

// Будує двомовний (PL+UA) анонс у форматі RX Team зі статичних блоків (settings).
export function buildAnnouncement(g: GameForAnnounce, s: Record<string, string>): string {
  const block = (lang: "pl" | "uk", scenario: string | null) => {
    const L = LABELS[lang];
    const date = DateTime.fromISO(g.gatherUtc, { zone: "utc" })
      .setZone(ZONE)
      .setLocale(lang)
      .toFormat("dd.MM.yyyy (cccc)");
    const parts = [
      `${L.flag} ${L.qo}${g.title ?? "ASG"}${L.qc} | ${date}`,
      ``,
      `📍 ${L.loc}: (${g.lat}, ${g.lng})`,
      `🕣 ${L.gather}: ${formatTime(g.gatherUtc)}`,
      `🎯 ${L.start}: ${formatTime(g.startUtc)}`,
    ];
    if (scenario) parts.push("", scenario);
    for (const key of [
      `ann_coffee_${lang}`,
      `ann_rental_${lang}`,
      `ann_transport_${lang}`,
      `ann_limits_${lang}`,
      `ann_disclaimer_${lang}`,
    ]) {
      if (s[key]) parts.push("", s[key]);
    }
    return parts.join("\n");
  };

  const cap = g.capacity ? `/${g.capacity}` : "";
  const head = `👥 ${g.count}${cap}`;
  const map = g.mapUrl ? `\n\n${g.mapUrl}` : "";
  return `${head}\n\n${block("pl", g.scenarioPl)}\n\n———————————————\n\n${block("uk", g.scenarioUk)}${map}`;
}
