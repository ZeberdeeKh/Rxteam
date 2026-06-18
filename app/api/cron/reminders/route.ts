import { supabase } from "@/lib/supabase";
import { bot } from "@/lib/bot";
import { getSetting, setSetting, featureEnabled } from "@/lib/settings";
import { formatWhen } from "@/lib/games";
import { processDueChoreReports } from "@/lib/chores";
import { tr } from "@/lib/strings";
import type { Lang } from "@/lib/i18n";
import { DAILY_REMINDER_DEFAULT } from "@/lib/admin-settings";
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
  // Звіт по чек-листах підготовки (пт 22:00) — незалежно від feature_reminders.
  // Ідемпотентно через chore_runs.report_at + status; пінгер ходить кожні ~15 хв.
  const chores = await processDueChoreReports(bot.api).catch((e) => {
    console.error("chore reports failed", e);
    return 0;
  });

  // Щоденне групове нагадування про реєстрацію (гілка «Флуд/Zalew») — незалежно від
  // feature_reminders (має власний feature_daily_reminder).
  const daily = await processDailyReminder().catch((e) => {
    console.error("daily reminder failed", e);
    return "error";
  });

  if (!(await featureEnabled("reminders")))
    return Response.json({ skipped: "disabled", chores, daily });

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

  return Response.json({ day, before, chores, daily });
}

// Перелік назв локацій у текст: «A», «A i B», «A, B i C» (сполучник передаємо мовою).
function joinNames(names: string[], conj: string): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} ${conj} ${names[names.length - 1]}`;
}

// Двомовне (UA+PL) щоденне нагадування про реєстрацію. Постить у гілку «Флуд/Zalew»
// раз на день о daily_reminder_hour (Europe/Warsaw), якщо цього календарного тижня (Пн–Нд)
// попереду є анонсована гра. Ідемпотентність — daily_reminder_last_sent (дата Вроцлава).
async function processDailyReminder(): Promise<string> {
  if (!(await featureEnabled("daily_reminder"))) return "disabled";
  const chatId = await getSetting("flood_chat_id");
  if (!chatId) return "no_topic"; // інертно, поки гілку не задано через /setflood

  const hour = Number((await getSetting("daily_reminder_hour")) ?? "18") || 18;
  const now = DateTime.now().setZone(ZONE);
  if (now.hour < hour) return "too_early";
  const today = now.toFormat("yyyy-MM-dd");
  if ((await getSetting("daily_reminder_last_sent")) === today) return "already_sent";

  // Анонсовані ігри цього календарного тижня (Luxon: тиждень Пн–Нд), які ще попереду.
  const weekEnd = now.endOf("week");
  const { data: games } = await supabase
    .from("games")
    .select("id, start_at, locations(name)")
    .eq("status", "announced")
    .gt("start_at", now.toUTC().toISO())
    .lte("start_at", weekEnd.toUTC().toISO())
    .order("start_at", { ascending: true });
  if (!games || games.length === 0) return "no_games";

  // Унікальні назви локацій у порядку ігор.
  const names: string[] = [];
  for (const g of games) {
    const nm = (g as any).locations?.name as string | undefined;
    if (nm && !names.includes(nm)) names.push(nm);
  }

  const siteUrl = (
    (await getSetting("site_url")) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.rxteam.pl"
  ).replace(/\/$/, "");
  const link = `${siteUrl}/games`;

  const tplUk = (await getSetting("daily_reminder_text_uk")) || DAILY_REMINDER_DEFAULT.uk;
  const tplPl = (await getSetting("daily_reminder_text_pl")) || DAILY_REMINDER_DEFAULT.pl;
  const fill = (tpl: string, conj: string) =>
    tpl.replace(/\{locations\}/g, joinNames(names, conj)).replace(/\{link\}/g, link);
  // UA + PL в одному повідомленні (показується всім, незалежно від мови гравця).
  const text = `${fill(tplUk, "і")}\n\n———————————————\n\n${fill(tplPl, "i")}`;

  const threadId = await getSetting("flood_thread_id");
  try {
    await bot.api.sendMessage(Number(chatId), text, {
      ...(threadId ? { message_thread_id: Number(threadId) } : {}),
    });
    await setSetting("daily_reminder_last_sent", today);
    return "sent";
  } catch (e) {
    console.error("daily reminder send failed", e);
    return "send_failed";
  }
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
