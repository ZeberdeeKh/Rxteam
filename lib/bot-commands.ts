// Команди меню бота, локалізовані pl/uk/en. Єдине джерело правди для:
//   • scripts/set-webhook.ts — базові набори (за language_code клієнта Telegram);
//   • lib/bot.ts — точне меню per-chat при зміні мови через /lang (scope chat).
import type { Lang } from "./i18n";

export interface BotMenuCommand {
  command: string;
  description: string;
}

// Видимі гравцям команди (без адмін-команд). Порядок = порядок показу в меню.
const COMMANDS: Record<Lang, BotMenuCommand[]> = {
  uk: [
    { command: "start", description: "🚀 Старт / Про бота" },
    { command: "profile", description: "👤 Мій профіль" },
    { command: "checkin", description: "✅ Чек-ін на гру" },
    { command: "top", description: "🏆 Топ гравців" },
    { command: "patch", description: "🪖 Нашивка" },
    { command: "rank", description: "⭐ Моє звання" },
    { command: "ref", description: "🔗 Реферальне посилання" },
    { command: "drivers", description: "🚗 Водії на гру" },
    { command: "myride", description: "🛞 Моя поїздка (водій)" },
    { command: "rules", description: "📋 Правила / FAQ" },
    { command: "lang", description: "🌐 Змінити мову" },
    { command: "cancel", description: "✖️ Скасувати дію" },
  ],
  pl: [
    { command: "start", description: "🚀 Start / O bocie" },
    { command: "profile", description: "👤 Mój profil" },
    { command: "checkin", description: "✅ Check-in na grę" },
    { command: "top", description: "🏆 Najlepsi gracze" },
    { command: "patch", description: "🪖 Naszywka członkowska" },
    { command: "rank", description: "⭐ Mój stopień" },
    { command: "ref", description: "🔗 Link polecający" },
    { command: "drivers", description: "🚗 Lista kierowców" },
    { command: "myride", description: "🛞 Mój przejazd (kierowca)" },
    { command: "rules", description: "📋 Zasady / FAQ" },
    { command: "lang", description: "🌐 Zmień język" },
    { command: "cancel", description: "✖️ Anuluj działanie" },
  ],
  en: [
    { command: "start", description: "🚀 Start / About" },
    { command: "profile", description: "👤 My profile" },
    { command: "checkin", description: "✅ Check in" },
    { command: "top", description: "🏆 Top players" },
    { command: "patch", description: "🪖 Membership patch" },
    { command: "rank", description: "⭐ My rank" },
    { command: "ref", description: "🔗 Referral link" },
    { command: "drivers", description: "🚗 Drivers list" },
    { command: "myride", description: "🛞 My ride (driver)" },
    { command: "rules", description: "📋 Rules / FAQ" },
    { command: "lang", description: "🌐 Change language" },
    { command: "cancel", description: "✖️ Cancel action" },
  ],
};

export const MENU_LANGS: Lang[] = ["uk", "pl", "en"];

export function playerCommands(lang: Lang): BotMenuCommand[] {
  return COMMANDS[lang] ?? COMMANDS.uk;
}
