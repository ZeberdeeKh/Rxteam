import { createHmac } from "crypto";

// Власна підписана сесія для входу через Telegram-віджет (Supabase Auth про
// TG-юзерів не знає). Cookie: "<playerId>.<exp>.<sig>", sig = HMAC-SHA256.
// Секрет: SESSION_SECRET, інакше WEBHOOK_SECRET (присутній на проді).
const SECRET = process.env.SESSION_SECRET ?? process.env.WEBHOOK_SECRET ?? "rx-dev-secret";

export const TG_SESSION_COOKIE = "rx_tg_session";
export const TG_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 днів

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function makeTgSession(playerId: number): string {
  const exp = Math.floor(Date.now() / 1000) + TG_SESSION_MAX_AGE;
  const payload = `${playerId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

// Повертає playerId, якщо підпис валідний і не прострочено; інакше null.
export function readTgSession(value?: string | null): number | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [pid, exp, sig] = parts;
  if (sign(`${pid}.${exp}`) !== sig) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  const id = Number(pid);
  return Number.isFinite(id) ? id : null;
}
