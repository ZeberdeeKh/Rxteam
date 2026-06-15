import { getSetting } from "./settings";
import {
  captchaPrompt,
  correctMap,
  wrongMap,
  expiredMap,
  faq,
  type Lang,
} from "./i18n";

// Налаштовувані тексти бота: беремо з settings (за ключами), інакше — fallback з i18n.
// Ключі редагуються в адмінці (6.4): captcha_*, cap_ok_*, cap_wrong_*, cap_expired_*, faq_*.
const ORDER: Lang[] = ["pl", "en", "uk"];
const FLAG: Record<Lang, string> = { pl: "🇵🇱", en: "🇬🇧", uk: "🇺🇦" };

async function tri(prefix: string, fallback: Record<Lang, string>): Promise<string> {
  const vals = await Promise.all(
    ORDER.map(async (l) => {
      const v = await getSetting(`${prefix}_${l}`);
      return v && v.trim() ? v.trim() : fallback[l];
    }),
  );
  return ORDER.map((l, i) => `${FLAG[l]} ${vals[i]}`).join("\n");
}

export async function buildCaptchaText(a: number, b: number): Promise<string> {
  return `🪖\n${await tri("captcha", captchaPrompt)}\n\n${a} + ${b} = ?`;
}
export async function buildCorrectText(): Promise<string> {
  return "✅\n" + (await tri("cap_ok", correctMap));
}
export async function buildWrongText(): Promise<string> {
  return "❌\n" + (await tri("cap_wrong", wrongMap));
}
export async function buildExpiredText(): Promise<string> {
  return "⏳\n" + (await tri("cap_expired", expiredMap));
}

// FAQ / правила — налаштовуються в settings (faq_pl|en|uk), інакше fallback.
export async function getFaqText(lang: Lang): Promise<string> {
  const v = await getSetting(`faq_${lang}`);
  return v && v.trim() ? v.trim() : faq[lang];
}
