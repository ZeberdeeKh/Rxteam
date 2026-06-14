import { supabase } from "@/lib/supabase";
import { bot } from "@/lib/bot";
import { getSetting, featureEnabled } from "@/lib/settings";
import { formatWhen } from "@/lib/games";
import { tr } from "@/lib/strings";
import type { Lang } from "@/lib/i18n";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ZONE = "Europe/Warsaw";

// Нагадування: напередодні о 18:00 (remind_day_hour) і за 2 год до старту (remind_before_h).
// Ідемпотентний — прапорці games.reminded_day / reminded_2h гарантують одне надсилання.
// Запуск зовнішнім пінгером раз на ~15 хв (Vercel Hobby крон ходить лише раз/добу).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!(await featureEnabled("reminders"))) return Response.json({ skipped: "disabled" });

  const nowMs = Date.now();
  const horizonIso = new Date(nowMs + 26 * 3600 * 1000).toISOString();
  const { data: games } = await supabase
    .from("games")
    .select("id, title, start_at, reminded_day, reminded_2h")
    .eq("status", "announced")
    .gt("start_at", new Date(nowMs).toISOString())
    .lt("start_at", horizonIso);

  const remindHour = Number((await getSetting("remind_day_hour")) ?? "18");
  const beforeH = Number((await getSetting("remind_before_h")) ?? "2");
  let day = 0;
  let before = 0;

  for (const g of games ?? []) {
    const start = DateTime.fromISO(g.start_at, { zone: "utc" });
    const startMs = start.toMillis();
    const dayMs = start
      .setZone(ZONE)
      .minus({ days: 1 })
      .set({ hour: remindHour, minute: 0, second: 0, millisecond: 0 })
      .toMillis();
    const h2Ms = start.minus({ hours: beforeH }).toMillis();

    if (!g.reminded_day && nowMs >= dayMs && nowMs < startMs) {
      await sendRemind(g, "remind_day");
      await supabase.from("games").update({ reminded_day: true }).eq("id", g.id);
      day++;
    }
    if (!g.reminded_2h && nowMs >= h2Ms && nowMs < startMs) {
      await sendRemind(g, "remind_2h");
      await supabase.from("games").update({ reminded_2h: true }).eq("id", g.id);
      before++;
    }
  }

  return Response.json({ day, before });
}

async function sendRemind(game: { id: number; title: string | null; start_at: string }, key: string) {
  const { data: regs } = await supabase
    .from("registrations")
    .select("players(tg_user_id, lang)")
    .eq("game_id", game.id)
    .eq("status", "registered");
  const when = formatWhen(game.start_at);
  for (const r of regs ?? []) {
    const pl = (r as any).players;
    if (!pl?.tg_user_id) continue;
    try {
      await bot.api.sendMessage(
        pl.tg_user_id,
        tr((pl.lang as Lang) ?? "uk", key, { title: game.title ?? "ASG", when }),
      );
    } catch {}
  }
}
