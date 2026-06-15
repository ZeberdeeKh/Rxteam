// Соцмережі RX Team (лендінг). Лінки керуються в адмінці → «Соцмережі» (лише майстер),
// зберігаються в таблиці settings. Порожнє значення → береться defaultUrl;
// якщо й він порожній (поки що Facebook) — блок показуємо як «скоро».
export type SocialKey = "instagram" | "telegram" | "facebook" | "tiktok" | "youtube";

export type SocialDef = {
  key: SocialKey;
  settingKey: string; // ключ у таблиці settings
  label: string;
  defaultUrl: string;
};

// Порядок тут = порядок блоків на лендінгу й полів у адмінці.
export const SOCIALS: SocialDef[] = [
  { key: "instagram", settingKey: "social_instagram_url", label: "Instagram", defaultUrl: "https://www.instagram.com/rxteam.pl" },
  { key: "telegram", settingKey: "social_telegram_url", label: "Telegram", defaultUrl: "https://t.me/rxteampl" },
  { key: "facebook", settingKey: "social_facebook_url", label: "Facebook", defaultUrl: "" }, // поки заглушка
  { key: "tiktok", settingKey: "social_tiktok_url", label: "TikTok", defaultUrl: "https://www.tiktok.com/@rxteam.pl" },
  { key: "youtube", settingKey: "social_youtube_url", label: "YouTube", defaultUrl: "" }, // поки заглушка
];

export type ResolvedSocial = SocialDef & { url: string };

// Резолв лінків: settings → fallback на defaultUrl. Приймаємо лише http(s); інакше url="" (блок «скоро»).
export function resolveSocials(settings: Record<string, string>): ResolvedSocial[] {
  return SOCIALS.map((s) => {
    const raw = (settings[s.settingKey] ?? "").trim() || s.defaultUrl;
    const url = /^https?:\/\//i.test(raw) ? raw : "";
    return { ...s, url };
  });
}
