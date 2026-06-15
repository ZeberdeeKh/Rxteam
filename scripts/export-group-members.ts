/* eslint-disable @typescript-eslint/no-explicit-any */
// Одноразова вигрузка учасників Telegram-групи через userbot (MTProto, GramJS).
// НЕ частина прод-бота і НЕ деплоїться (виключено в tsconfig). Запуск ЛОКАЛЬНО з акаунту,
// який Є учасником групи (для повного списку — краще адміном групи).
//
// ── Підготовка ──
//   1) Встановити залежності лише локально (без запису в package.json):
//        npm i --no-save telegram input
//   2) Отримати api_id / api_hash: https://my.telegram.org → API development tools
//   3) Перший запуск без TG_SESSION — інтерактивний логін (телефон, код, 2FA),
//      після чого скрипт надрукує SESSION-рядок. Збережіть його в TG_SESSION,
//      щоб наступні запуски не питали код повторно.
//
// ── Запуск (PowerShell) ──
//   $env:TG_API_ID=12345; $env:TG_API_HASH="..."; $env:TG_GROUP="@rxteam"
//   npx tsx scripts/export-group-members.ts
//   # повторний запуск із готовою сесією:
//   $env:TG_SESSION="<рядок>"; ... ; npx tsx scripts/export-group-members.ts
//   # записати НОВИХ гравців у Supabase (а не лише CSV):
//   $env:WRITE_DB="1"; $env:SUPABASE_URL="..."; $env:SUPABASE_SECRET_KEY="..."; ... ; npx tsx scripts/export-group-members.ts
//
// ── Поведінка ──
//   • за замовчуванням DRY RUN: лише читає учасників і пише scripts/group-members.csv;
//   • з WRITE_DB=1 — ДОДАЄ в таблицю players ТІЛЬКИ нових (за tg_user_id),
//     наявних гравців (їх позивні/бали/звання) не чіпає.

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import input from "input";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Підвантажуємо змінні з .env.local / .env (щоб не вписувати SUPABASE_SECRET_KEY вручну в термінал).
// Не перезаписує те, що вже задано в оточенні (TG_* з терміналу мають пріоритет).
for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH ?? "";
const group = process.env.TG_GROUP ?? "";
const sessionStr = process.env.TG_SESSION ?? "";
const writeDb = process.env.WRITE_DB === "1";

if (!apiId || !apiHash) {
  console.error("Потрібні TG_API_ID і TG_API_HASH (з my.telegram.org).");
  process.exit(1);
}
if (!group) {
  console.error("Потрібен TG_GROUP (напр. @rxteam, посилання або числовий id).");
  process.exit(1);
}

interface Member {
  tg_user_id: number;
  tg_username: string | null;
  name: string | null;
  is_bot: boolean;
}

function csvCell(v: string | number | null): string {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text("Телефон (у форматі +380...): "),
    password: async () => await input.text("Пароль 2FA (якщо увімкнено): "),
    phoneCode: async () => await input.text("Код з Telegram: "),
    onError: (e) => console.error(e),
  });

  if (!sessionStr) {
    console.log("\n=== ЗБЕРЕЖІТЬ ЦЕЙ РЯДОК у TG_SESSION (щоб не логінитись повторно) ===");
    console.log(client.session.save());
    console.log("===================================================================\n");
  }

  const entity = await client.getEntity(group);
  // getParticipants пагінує сам. Для великих супергруп повний список бачить лише адмін групи.
  const participants = await client.getParticipants(entity, {});
  console.log(`Знайдено записів учасників: ${participants.length}`);

  const members: Member[] = [];
  for (const u of participants as any[]) {
    if (u.className !== "User") continue; // пропускаємо канали/інше
    if (u.deleted) continue; // видалені акаунти
    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null;
    members.push({
      tg_user_id: Number(u.id),
      tg_username: u.username ?? null,
      name,
      is_bot: !!u.bot,
    });
  }

  const players = members.filter((m) => !m.is_bot);
  console.log(`Реальних гравців (без ботів): ${players.length}`);

  // CSV пишемо завжди.
  const header = "tg_user_id,tg_username,name,is_bot";
  const rows = members.map((m) =>
    [csvCell(m.tg_user_id), csvCell(m.tg_username), csvCell(m.name), m.is_bot ? "1" : "0"].join(","),
  );
  const outPath = "scripts/group-members.csv";
  writeFileSync(outPath, [header, ...rows].join("\n"), "utf8");
  console.log(`CSV записано: ${outPath}`);

  if (writeDb) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      console.error("Для WRITE_DB потрібні SUPABASE_URL і SUPABASE_SECRET_KEY — пропускаю запис у БД.");
    } else {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      // Які tg_user_id вже є — щоб НЕ перезаписувати наявних гравців.
      const { data: existing } = await supabase
        .from("players")
        .select("tg_user_id")
        .not("tg_user_id", "is", null);
      const known = new Set((existing ?? []).map((r: any) => Number(r.tg_user_id)));
      const toInsert = players
        .filter((m) => !known.has(m.tg_user_id))
        .map((m) => ({ tg_user_id: m.tg_user_id, name: m.name, tg_username: m.tg_username, lang: "uk" }));

      if (toInsert.length === 0) {
        console.log("Нових гравців немає — у БД нічого не додано.");
      } else {
        const { error } = await supabase.from("players").insert(toInsert);
        if (error) console.error("Помилка вставки:", error.message);
        else console.log(`Додано нових гравців: ${toInsert.length} (наявні ${known.size} не змінені).`);
      }
    }
  } else {
    console.log("DRY RUN: у БД нічого не писалось. Для запису додайте WRITE_DB=1.");
  }

  await client.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
