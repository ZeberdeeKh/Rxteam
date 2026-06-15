/* eslint-disable @typescript-eslint/no-explicit-any */
// Імпорт гравців із scripts/group-members.csv у таблицю players (Supabase).
// НЕ деплоїться (виключено в tsconfig). Telegram НЕ потрібен — читає вже готовий CSV.
// Додає ТІЛЬКИ нових (за tg_user_id); наявних гравців (позивні/бали/звання) не чіпає.
//
// Запуск:  npx tsx scripts/import-members-csv.ts
// (SUPABASE_URL / SUPABASE_SECRET_KEY беруться з .env автоматично)

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Підвантажуємо .env.local / .env (не перезаписуючи вже задане в оточенні).
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

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Потрібні SUPABASE_URL і SUPABASE_SECRET_KEY (у .env).");
  process.exit(1);
}

const CSV_PATH = "scripts/group-members.csv";
if (!existsSync(CSV_PATH)) {
  console.error(`Нема файлу ${CSV_PATH}. Спершу зробіть вигрузку (export-group-members).`);
  process.exit(1);
}

// Розбір CSV-рядка з підтримкою лапок ("" = екранована лапка).
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

interface Row {
  tg_user_id: number;
  tg_username: string | null;
  name: string | null;
}

async function main() {
  const lines = readFileSync(CSV_PATH, "utf8").split(/\r?\n/).filter((l) => l.length > 0);
  lines.shift(); // заголовок

  const byId = new Map<number, Row>();
  for (const line of lines) {
    const [idStr, username, name, isBot] = parseLine(line);
    if (isBot === "1") continue; // боти — пропускаємо
    const id = Number(idStr);
    if (!id) continue;
    byId.set(id, {
      tg_user_id: id,
      tg_username: username || null,
      name: name || null,
    });
  }
  const rows = [...byId.values()];
  console.log(`У CSV гравців (без ботів, унікальних): ${rows.length}`);

  const supabase = createClient(url!, key!, { auth: { persistSession: false } });

  const { data: existing, error: selErr } = await supabase
    .from("players")
    .select("tg_user_id")
    .not("tg_user_id", "is", null);
  if (selErr) {
    console.error("Помилка читання players:", selErr.message);
    process.exit(1);
  }
  const known = new Set((existing ?? []).map((r: any) => Number(r.tg_user_id)));
  console.log(`Уже в БД (з tg_user_id): ${known.size}`);

  const toInsert = rows
    .filter((r) => !known.has(r.tg_user_id))
    .map((r) => ({ tg_user_id: r.tg_user_id, name: r.name, tg_username: r.tg_username, lang: "uk" }));

  if (toInsert.length === 0) {
    console.log("Нових гравців немає — нічого не додано.");
    process.exit(0);
  }

  // Вставляємо пачками по 200.
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 200) {
    const batch = toInsert.slice(i, i + 200);
    const { error } = await supabase.from("players").insert(batch);
    if (error) {
      console.error(`Помилка вставки (пачка з ${i}):`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`...додано ${inserted}/${toInsert.length}`);
  }
  console.log(`Готово. Додано нових гравців: ${inserted}. Наявні ${known.size} не змінені.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
