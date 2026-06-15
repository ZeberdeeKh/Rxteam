// Чек-лист підготовки до гри (Етап 13). Постить у закриту адмін-групу при анонсі гри;
// кожен бере пункт на себе (одна людина на пункт); у п'ятницю 22:00 — звіт і закриття.
//
// Цей модуль — bot-agnostic: надсилання робиться через переданий grammy `Api`
// (ctx.api у боті / bot.api у кроні), щоб не було циклічного імпорту з lib/bot.ts.
import { InlineKeyboard, type Api } from "grammy";
import { DateTime } from "luxon";
import { supabase } from "./supabase";
import { getSetting, featureEnabled } from "./settings";
import { formatWhen } from "./games";

const ZONE = "Europe/Warsaw";

export type ChoreItem = {
  id: number;
  kind: string; // 'action' | 'gear'
  label: string;
  note: string | null; // опис під пунктом (напр. список покупок)
  sort_order: number;
  claimed_tg_id: number | null;
  claimed_name: string | null;
};

type GameLite = { title: string | null; start_at: string } | null;

// Екранування для parse_mode=HTML (мітки/імена можуть містити < > &).
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Час звіту: п'ятниця 22:00 (Europe/Warsaw) перед грою.
export function computeReportAt(startUtc: string): string {
  const start = DateTime.fromISO(startUtc, { zone: "utc" }).setZone(ZONE);
  const now = DateTime.now().setZone(ZONE);
  // П'ятниця (weekday 5) того ж ISO-тижня о 22:00.
  let friday = start.set({ weekday: 5, hour: 22, minute: 0, second: 0, millisecond: 0 });
  // Якщо ця п'ятниця не раніше старту (гра в пт до 22:00 або раніше тижня) — на тиждень назад.
  if (friday >= start) friday = friday.minus({ weeks: 1 });
  // Пізній анонс (п'ятниця вже минула) — звіт за 2 год до старту, або на старті.
  if (friday <= now) {
    const twoH = start.minus({ hours: 2 });
    friday = twoH > now ? twoH : start;
  }
  return friday.toUTC().toISO()!;
}

function header(prefix: string, game: GameLite): string {
  const title = game?.title ? ` «${esc(game.title)}»` : "";
  const when = game?.start_at ? ` (${formatWhen(game.start_at)})` : "";
  return `${prefix}${title}${when}`;
}

function lines(items: ChoreItem[], kind: string, freeMark: string): string {
  return items
    .filter((i) => i.kind === kind)
    .map((i) => {
      const head = i.claimed_name
        ? `✅ ${esc(i.label)} — <i>${esc(i.claimed_name)}</i>`
        : `${freeMark} ${esc(i.label)}`;
      return i.note ? `${head}\n   <i>${esc(i.note)}</i>` : head;
    })
    .join("\n");
}

// Текст інтерактивного чек-листа (HTML).
export function buildChoreText(game: GameLite, items: ChoreItem[]): string {
  const actions = lines(items, "action", "⬜");
  const gear = lines(items, "gear", "⬜");
  const parts = [`🗒 <b>Підготовка до гри</b>${header("", game)}`];
  if (actions) parts.push(`\n🔧 <b>Дії:</b>\n${actions}`);
  if (gear) parts.push(`\n🎒 <b>Взяти на гру:</b>\n${gear}`);
  parts.push(`\n<i>Тицяй на пункт, щоб взяти його на себе (повторний клік — звільнити).</i>`);
  return parts.join("\n");
}

// Клавіатура: по кнопці на пункт (callback_data = chore:<itemId>).
export function buildChoreKeyboard(items: ChoreItem[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const i of items) {
    const label = i.claimed_name ? `✅ ${i.label} · ${i.claimed_name}` : `⬜ ${i.label}`;
    kb.text(label.length > 60 ? label.slice(0, 59) + "…" : label, `chore:${i.id}`).row();
  }
  return kb;
}

// Текст п'ятничного звіту (HTML): хто що взяв + що лишилось вільним.
export function buildReportText(game: GameLite, items: ChoreItem[]): string {
  const block = (kind: string, head: string) => {
    const list = items.filter((i) => i.kind === kind);
    if (!list.length) return "";
    const body = list
      .map((i) => {
        const head = i.claimed_name
          ? `✅ ${esc(i.label)} — <i>${esc(i.claimed_name)}</i>`
          : `❌ ${esc(i.label)} — <b>вільно</b>`;
        return i.note ? `${head}\n   <i>${esc(i.note)}</i>` : head;
      })
      .join("\n");
    return `\n${head}\n${body}`;
  };
  const taken = items.filter((i) => i.claimed_name).length;
  const total = items.length;
  return [
    header("📋 <b>Звіт підготовки до гри</b>", game),
    block("action", "🔧 <b>Дії:</b>"),
    block("gear", "🎒 <b>Взяти на гру:</b>"),
    `\nВзято: <b>${taken}/${total}</b>. Без виконавця: <b>${total - taken}</b>.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchItems(runId: number): Promise<ChoreItem[]> {
  const { data } = await supabase
    .from("chore_run_items")
    .select("id, kind, label, note, sort_order, claimed_tg_id, claimed_name")
    .eq("run_id", runId)
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []) as ChoreItem[];
}

async function fetchGame(gameId: number): Promise<GameLite> {
  const { data } = await supabase.from("games").select("title, start_at").eq("id", gameId).single();
  return (data as GameLite) ?? null;
}

// Створити run для гри + знімок активних шаблонів, запостити чек-лист у адмін-групу.
// Гейти: feature_chores увімкнено, налаштовано chores_chat_id, run на цю гру ще нема.
export async function postChoreRun(api: Api, gameId: number): Promise<void> {
  if (!(await featureEnabled("chores"))) return;
  const chatId = await getSetting("chores_chat_id");
  if (!chatId) return;
  const threadId = await getSetting("chores_thread_id");

  const { data: existing } = await supabase
    .from("chore_runs")
    .select("id")
    .eq("game_id", gameId)
    .maybeSingle();
  if (existing) return;

  const game = await fetchGame(gameId);
  if (!game) return;

  const { data: templates } = await supabase
    .from("chore_templates")
    .select("kind, label, note, sort_order")
    .eq("active", true)
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });
  if (!templates?.length) return;

  const { data: run } = await supabase
    .from("chore_runs")
    .insert({
      game_id: gameId,
      chat_id: Number(chatId),
      thread_id: threadId ? Number(threadId) : null,
      status: "open",
      report_at: computeReportAt(game.start_at),
    })
    .select("id")
    .single();
  if (!run) return;

  await supabase.from("chore_run_items").insert(
    templates.map((t) => ({
      run_id: run.id,
      kind: t.kind,
      label: t.label,
      note: t.note,
      sort_order: t.sort_order,
    })),
  );

  const items = await fetchItems(run.id);
  try {
    const msg = await api.sendMessage(Number(chatId), buildChoreText(game, items), {
      parse_mode: "HTML",
      reply_markup: buildChoreKeyboard(items),
      ...(threadId ? { message_thread_id: Number(threadId) } : {}),
    });
    await supabase.from("chore_runs").update({ message_id: msg.message_id }).eq("id", run.id);
  } catch (e) {
    console.error("postChoreRun: send failed", e);
  }
}

export type ToggleResult = {
  runId: number | null;
  result: "taken" | "released" | "busy" | "closed" | "gone";
  busyName?: string;
};

// Тогл «взяв/звільнив» (одна людина на пункт). Атомарно через умовний апдейт.
export async function toggleChoreClaim(
  itemId: number,
  tgId: number,
  name: string,
): Promise<ToggleResult> {
  const { data: item } = await supabase
    .from("chore_run_items")
    .select("id, run_id, claimed_tg_id, claimed_name")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { runId: null, result: "gone" };

  const { data: run } = await supabase
    .from("chore_runs")
    .select("status")
    .eq("id", item.run_id)
    .maybeSingle();
  if (!run || run.status !== "open") return { runId: item.run_id, result: "closed" };

  // Вільний → беремо (умова claimed_tg_id IS NULL страхує від гонки двох кліків).
  if (item.claimed_tg_id == null) {
    const { data: upd } = await supabase
      .from("chore_run_items")
      .update({ claimed_tg_id: tgId, claimed_name: name, claimed_at: new Date().toISOString() })
      .eq("id", itemId)
      .is("claimed_tg_id", null)
      .select("id");
    if (upd && upd.length) return { runId: item.run_id, result: "taken" };
    // Хтось випередив — перечитуємо ім'я.
    const { data: fresh } = await supabase
      .from("chore_run_items")
      .select("claimed_name")
      .eq("id", itemId)
      .maybeSingle();
    return { runId: item.run_id, result: "busy", busyName: fresh?.claimed_name ?? undefined };
  }

  // Мій пункт → звільняємо.
  if (Number(item.claimed_tg_id) === tgId) {
    await supabase
      .from("chore_run_items")
      .update({ claimed_tg_id: null, claimed_name: null, claimed_at: null })
      .eq("id", itemId);
    return { runId: item.run_id, result: "released" };
  }

  // Чужий зайнятий пункт.
  return { runId: item.run_id, result: "busy", busyName: item.claimed_name ?? undefined };
}

// Перемалювати повідомлення чек-листа після зміни.
export async function refreshChoreMessage(api: Api, runId: number): Promise<void> {
  const { data: run } = await supabase
    .from("chore_runs")
    .select("chat_id, message_id, game_id")
    .eq("id", runId)
    .maybeSingle();
  if (!run?.chat_id || !run.message_id) return;
  const game = await fetchGame(run.game_id);
  const items = await fetchItems(runId);
  try {
    await api.editMessageText(Number(run.chat_id), run.message_id, buildChoreText(game, items), {
      parse_mode: "HTML",
      reply_markup: buildChoreKeyboard(items),
    });
  } catch (e) {
    console.error("refreshChoreMessage failed", e);
  }
}

// Звіти, у яких настав report_at: надіслати звіт, заморозити чек-лист, закрити run.
// Ідемпотентно: обробляються лише status='open' AND report_at<=now.
export async function processDueChoreReports(api: Api): Promise<number> {
  const nowIso = new Date().toISOString();
  const { data: runs } = await supabase
    .from("chore_runs")
    .select("id, chat_id, thread_id, message_id, game_id")
    .eq("status", "open")
    .lte("report_at", nowIso);

  let sent = 0;
  for (const run of runs ?? []) {
    if (run.chat_id) {
      const game = await fetchGame(run.game_id);
      const items = await fetchItems(run.id);
      try {
        await api.sendMessage(Number(run.chat_id), buildReportText(game, items), {
          parse_mode: "HTML",
          ...(run.thread_id ? { message_thread_id: Number(run.thread_id) } : {}),
        });
        if (run.message_id) {
          // Прибрати кнопки в оригіналі (заморозити прийом пунктів).
          try {
            await api.editMessageReplyMarkup(Number(run.chat_id), run.message_id);
          } catch {}
        }
        sent++;
      } catch (e) {
        console.error("processDueChoreReports: send failed", e);
      }
    }
    await supabase
      .from("chore_runs")
      .update({ status: "reported", reported_at: nowIso })
      .eq("id", run.id);
  }
  return sent;
}
