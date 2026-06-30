import { InlineKeyboard } from "grammy";
import { supabase } from "@/lib/supabase";
import { bot } from "@/lib/bot";
import { REG_BTN } from "@/lib/game-announce";
import { getSetting, featureEnabled } from "@/lib/settings";
import { formatWhen } from "@/lib/games";
import { processDueChoreReports } from "@/lib/chores";
import { tr } from "@/lib/strings";
import type { Lang } from "@/lib/i18n";
import { DAILY_REMINDER_DEFAULT, DAILY_REMINDER_CARPOOL } from "@/lib/admin-settings";
import { DateTime } from "luxon";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ZONE = "Europe/Warsaw";

// Нагадування: напередодні о 18:00 (remind_day_hour) і за 2 год до старту (remind_before_h).
// Ідемпотентний — прапорці games.reminded_day / reminded_2h гарантують одне надсилання.
// Запуск зовнішнім пінгером раз на ~15 хв (Vercel Hobby крон ходить лише раз/добу).
export async function GET(req: Request) {
  const denied = checkCronAuth(req);
  if (denied) return denied;
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

  // Username бота для deep-link кнопки «Деталі гри» (?start=g{id}) — отримуємо один раз.
  const botUsername = (games?.length ? (await bot.api.getMe()).username : "") ?? "";

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
      await sendRemind(g, "remind_day", botUsername);
      await supabase.from("games").update({ reminded_day: true }).eq("id", g.id);
      day++;
    }
    if (!g.reminded_2h && nowMs >= h2Ms && nowMs < startMs) {
      await sendRemind(g, "remind_2h", botUsername);
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
  // Системний блок про карпул дописуємо лише коли карпул увімкнено (інакше не рекламуємо
  // вимкнену функцію). Згадка команд /drivers + реєстрація водієм — для записаних на гру.
  const carpool = (await featureEnabled("carpool_map"))
    ? DAILY_REMINDER_CARPOOL
    : { uk: "", pl: "" };
  // UA + PL в одному повідомленні (показується всім, незалежно від мови гравця).
  const text = `${fill(tplUk, "і")}${carpool.uk}\n\n———————————————\n\n${fill(tplPl, "i")}${carpool.pl}`;

  const threadId = await getSetting("flood_thread_id");
  // Кнопка «в один клік з бота»: deep-link відкриває приватний чат з ботом і показує
  // список ігор (/start games → showGamesList). Посилання на сайт лишається в тексті.
  const me = await bot.api.getMe();
  const kb = new InlineKeyboard().url(REG_BTN, `https://t.me/${me.username}?start=games`);

  // Атомарно «займаємо» сьогоднішній слот ДО надсилання. Раніше прапорець ставився ПІСЛЯ
  // sendMessage — лишалося вікно (повільна відправка), у якому наступний тік пінгера (~15 хв)
  // або паралельний виклик проходили перевірку й слали повідомлення вдруге. Один умовний
  // UPDATE розв'язує і гонку (Postgres перечитує WHERE після блокування рядка — оновить
  // лише один виклик), і повтор після збою відповіді Telegram (повідомлення доставлено,
  // але клієнт кинув таймаут): слот уже зайнятий, тож ретраю не буде.
  await supabase
    .from("settings")
    .upsert({ key: "daily_reminder_last_sent", value: "" }, { onConflict: "key", ignoreDuplicates: true });
  const { data: claimed, error: claimErr } = await supabase
    .from("settings")
    .update({ value: today, updated_at: now.toUTC().toISO() })
    .eq("key", "daily_reminder_last_sent")
    .neq("value", today)
    .select("key");
  if (claimErr) {
    console.error("daily reminder claim failed", claimErr);
    return "claim_failed";
  }
  if (!claimed || claimed.length === 0) return "already_sent"; // слот уже зайняв інший виклик

  // Слот наш — надсилаємо. Клейм НЕ відкочуємо навіть при збої: краще пропустити день,
  // ніж ризикнути дублем (відкат повернув би стару проблему з таймаутом доставленого повідомлення).
  try {
    await bot.api.sendMessage(Number(chatId), text, {
      reply_markup: kb,
      ...(threadId ? { message_thread_id: Number(threadId) } : {}),
    });
    return "sent";
  } catch (e) {
    console.error("daily reminder send failed", e);
    return "send_failed";
  }
}

async function sendRemind(
  game: { id: number; title: string | null; start_at: string },
  key: string,
  botUsername: string,
) {
  const { data: regs } = await supabase
    .from("registrations")
    .select("players(tg_user_id, lang)")
    .eq("game_id", game.id)
    .eq("status", "registered");
  const when = formatWhen(game.start_at);
  for (const r of regs ?? []) {
    const pl = (r as any).players;
    if (!pl?.tg_user_id) continue;
    const lang = (pl.lang as Lang) ?? "uk";
    // Кнопка під нагадуванням: за день — «Деталі гри» (deep-link на картку гри),
    // за 2 год — «Перевірити карпул» (список водіїв цієї гри, callback drivers:{id}).
    const kb =
      key === "remind_day" && botUsername
        ? new InlineKeyboard().url(tr(lang, "btn_game_details"), `https://t.me/${botUsername}?start=g${game.id}`)
        : key === "remind_2h"
          ? new InlineKeyboard().text(tr(lang, "btn_check_carpool"), `drivers:${game.id}`)
          : undefined;
    try {
      await bot.api.sendMessage(
        pl.tg_user_id,
        tr(lang, key, { title: game.title ?? "ASG", when }),
        kb ? { reply_markup: kb } : undefined,
      );
    } catch {}
  }
}
