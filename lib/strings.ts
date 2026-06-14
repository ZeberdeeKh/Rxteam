import type { Lang } from "./i18n";

type Dict = Record<Lang, string>;

// Переклади інтерфейсу (показуються мовою гравця). Підтримують {плейсхолдери}.
const S: Record<string, Dict> = {
  start: {
    pl: "🪖 Cześć, operatorze! Wkrótce zapiszesz się tu na grę, zrobisz check-in i sprawdzisz swój stopień.\nZmiana języka — /lang",
    en: "🪖 Hey, operator! Soon you'll sign up for games here, check in and track your rank.\nChange language — /lang",
    uk: "🪖 Привіт, бійцю! Скоро тут реєструватимешся на гру, робитимеш чек-ін і дивитимешся своє звання.\nЗмінити мову — /lang",
  },
  lang_set: {
    pl: "✅ Język ustawiony: polski.",
    en: "✅ Language set: English.",
    uk: "✅ Мову встановлено: українська.",
  },
  profile: {
    pl: "👤 Profil\nImię: {name}\nPseudonim: {callsign}\nTG: {tg}\nRozegrane gry: {games}",
    en: "👤 Profile\nName: {name}\nCallsign: {callsign}\nTG: {tg}\nGames played: {games}",
    uk: "👤 Профіль\nІм'я: {name}\nПозивний: {callsign}\nTG: {tg}\nЗіграно ігор: {games}",
  },
  callsign_unset: {
    pl: "nie ustawiony (podasz przy pierwszej rejestracji)",
    en: "not set (you'll enter it at first sign-up)",
    uk: "не встановлено (впишеш при першій реєстрації)",
  },
  badge_master: { pl: "⭐ Master-admin", en: "⭐ Master admin", uk: "⭐ Майстер-адмін" },
  badge_admin: { pl: "🛡 Administrator", en: "🛡 Admin", uk: "🛡 Адмін" },
  not_admin: { pl: "⛔ Tylko dla adminów.", en: "⛔ Admins only.", uk: "⛔ Лише для адмінів." },
  admin_panel: {
    pl: "🛡 Panel admina\nUprawnienia: {perms}",
    en: "🛡 Admin panel\nPermissions: {perms}",
    uk: "🛡 Адмін-панель\nПрава: {perms}",
  },
  sethere_group_only: {
    pl: "Wykonaj tę komendę w grupie, w temacie „Ogłoszenia”.",
    en: "Run this command in the group, in the “Announcements” topic.",
    uk: "Виконай цю команду в групі, у топіку «Анонси».",
  },
  sethere_ok: {
    pl: "✅ Temat na ogłoszenia zapisany.",
    en: "✅ Announcements topic saved.",
    uk: "✅ Топік для анонсів збережено.",
  },
  loc_ask_name: {
    pl: "📍 Podaj nazwę lokacji:",
    en: "📍 Enter the location name:",
    uk: "📍 Введи назву локації:",
  },
  loc_ask_pin: {
    pl: "Teraz wyślij punkt na mapie (📎 → Lokalizacja):",
    en: "Now send a map point (📎 → Location):",
    uk: "Тепер надішли точку на карті (📎 → Локація):",
  },
  loc_ask_radius: {
    pl: "Promień strefy check-inu w metrach (wybierz lub wpisz):",
    en: "Check-in radius in meters (pick or type):",
    uk: "Радіус зони чек-іну в метрах (обери або впиши):",
  },
  loc_bad_radius: {
    pl: "Podaj liczbę w metrach (np. 300).",
    en: "Enter a number in meters (e.g. 300).",
    uk: "Введи число в метрах (напр. 300).",
  },
  loc_saved: {
    pl: "✅ Lokacja «{name}» zapisana (promień {radius} m).",
    en: "✅ Location «{name}» saved (radius {radius} m).",
    uk: "✅ Локацію «{name}» збережено (радіус {radius} м).",
  },
  locations_title: { pl: "📍 Lokacje:", en: "📍 Locations:", uk: "📍 Локації:" },
  locations_empty: {
    pl: "Brak lokacji. Dodaj: /addlocation",
    en: "No locations yet. Add one: /addlocation",
    uk: "Локацій ще немає. Додай: /addlocation",
  },
  cancelled: { pl: "Anulowano.", en: "Cancelled.", uk: "Скасовано." },
};

export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = (S[key] && (S[key][lang] ?? S[key].en)) ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
