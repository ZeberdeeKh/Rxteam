import { createHash, createHmac } from "crypto";

// Перевірка підпису даних від Telegram Login Widget.
// https://core.telegram.org/widgets/login#checking-authorization
export function verifyTelegramAuth(
  data: Record<string, string>,
  botToken: string,
): boolean {
  const { hash, ...rest } = data;
  if (!hash) return false;

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secret = createHash("sha256").update(botToken).digest();
  const hmac = createHmac("sha256", secret).update(checkString).digest("hex");
  return hmac === hash;
}

// Свіжість авторизації (захист від повторного використання старого лінка).
export function isAuthFresh(authDate: string | number, maxAgeSec = 86400): boolean {
  const ts = Number(authDate);
  if (!Number.isFinite(ts)) return false;
  return Math.floor(Date.now() / 1000) - ts < maxAgeSec;
}
