import { createHmac, timingSafeEqual } from "crypto";

// Власна підписана сесія для входу через Telegram-віджет (Supabase Auth про
// TG-юзерів не знає). Cookie: "<playerId>.<exp>.<sig>", sig = HMAC-SHA256.
// Секрет: SESSION_SECRET, інакше WEBHOOK_SECRET (присутній на проді).
// FAIL-CLOSED: у проді секрет ОБОВ'ЯЗКОВИЙ — інакше кидаємо, щоб НІКОЛИ не підписувати
// публічним літералом (інакше будь-хто підробить rx_tg_session для будь-якого playerId,
// у т.ч. майстра). Дев-літерал лишаємо тільки поза продом.
function resolveSessionSecret(): string {
  const s = process.env.SESSION_SECRET ?? process.env.WEBHOOK_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET or WEBHOOK_SECRET must be set in production");
  }
  return "rx-dev-secret";
}
const SECRET = resolveSessionSecret();

// Порівняння підписів у постійний час (захист від timing-оракула).
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

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
  if (!safeEqual(sign(`${pid}.${exp}`), sig)) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  const id = Number(pid);
  return Number.isFinite(id) ? id : null;
}
