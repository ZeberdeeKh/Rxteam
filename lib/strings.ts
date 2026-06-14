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

  // створення гри
  gamenew_no_loc: {
    pl: "Najpierw dodaj lokację: /addlocation",
    en: "Add a location first: /addlocation",
    uk: "Спершу додай локацію: /addlocation",
  },
  gamenew_no_topic: {
    pl: "⚠️ Najpierw ustaw temat ogłoszeń: /sethere w grupie.",
    en: "⚠️ Set the announcements topic first: /sethere in the group.",
    uk: "⚠️ Спершу встанови топік анонсів: /sethere у групі.",
  },
  gamenew_pick_loc: { pl: "Wybierz lokację:", en: "Pick a location:", uk: "Обери локацію:" },
  gamenew_when: {
    pl: "Podaj datę i godzinę (DD.MM GG:MM, np. 21.06 09:00):",
    en: "Enter date & time (DD.MM HH:MM, e.g. 21.06 09:00):",
    uk: "Введи дату і час (ДД.ММ ГГ:ХХ, напр. 21.06 09:00):",
  },
  gamenew_bad_when: {
    pl: "Nie rozumiem daty. Format: 21.06 09:00",
    en: "Can't parse the date. Format: 21.06 09:00",
    uk: "Не розумію дату. Формат: 21.06 09:00",
  },
  gamenew_cap: {
    pl: "Limit uczestników? Wpisz liczbę lub naciśnij przycisk:",
    en: "Participant limit? Type a number or tap the button:",
    uk: "Ліміт учасників? Впиши число або натисни кнопку:",
  },
  gamenew_nolimit: { pl: "Bez limitu", en: "No limit", uk: "Без ліміту" },
  gamenew_done: {
    pl: "✅ Gra #{id} utworzona, ogłoszenie opublikowane.\n📅 {when}\nRejestracja do {regclose}.",
    en: "✅ Game #{id} created, announcement posted.\n📅 {when}\nRegistration until {regclose}.",
    uk: "✅ Гру #{id} створено, анонс опубліковано.\n📅 {when}\nРеєстрація до {regclose}.",
  },

  // картка гри + реєстрація
  game_card: {
    pl: "🎯 {loc}\n📅 {when} (Wrocław)\n👥 Zapisani: {count}",
    en: "🎯 {loc}\n📅 {when} (Wrocław)\n👥 Registered: {count}",
    uk: "🎯 {loc}\n📅 {when} (Вроцлав)\n👥 Записані: {count}",
  },
  btn_register: { pl: "✅ Zapisz się", en: "✅ Sign up", uk: "✅ Записатись" },
  btn_leave: { pl: "❌ Wypisz się", en: "❌ Leave", uk: "❌ Відписатись" },
  game_not_found: { pl: "Gra nie znaleziona.", en: "Game not found.", uk: "Гру не знайдено." },
  reg_closed: {
    pl: "Rejestracja zamknięta (mniej niż 9 godz. do startu).",
    en: "Registration closed (less than 9h before start).",
    uk: "Реєстрацію закрито (менше 9 год до старту).",
  },
  already_reg: {
    pl: "Już jesteś zapisany.",
    en: "You're already signed up.",
    uk: "Ти вже записаний.",
  },
  game_full: { pl: "Brak miejsc.", en: "No spots left.", uk: "Місць немає." },
  ask_callsign: {
    pl: "Podaj swój pseudonim (callsign) — ustawiasz go raz:",
    en: "Enter your callsign — set once:",
    uk: "Впиши свій позивний (callsign) — встановлюється один раз:",
  },
  callsign_taken: {
    pl: "Ten pseudonim jest zajęty, podaj inny:",
    en: "That callsign is taken, try another:",
    uk: "Цей позивний зайнятий, впиши інший:",
  },
  reg_done: {
    pl: "✅ Zapisano: {loc}, {when}.",
    en: "✅ Signed up: {loc}, {when}.",
    uk: "✅ Записано: {loc}, {when}.",
  },
  unreg_done: {
    pl: "Wypisano. Do zobaczenia następnym razem!",
    en: "You've left the game.",
    uk: "Тебе відписано.",
  },
  cancel_locked: {
    pl: "Wypisać można najpóźniej 24 godz. przed startem. Teraz nieobecność = minus punkty.",
    en: "You can leave up to 24h before start. Now a no-show = minus points.",
    uk: "Відписатись можна не пізніше ніж за 24 год до старту. Зараз неявка = мінус бали.",
  },
};

export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = (S[key] && (S[key][lang] ?? S[key].en)) ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
