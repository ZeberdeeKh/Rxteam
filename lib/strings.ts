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
    pl: "Wyślij punkt na mapie (📎 → Lokalizacja) albo wpisz współrzędne: 51.1523, 16.7717",
    en: "Send a map point (📎 → Location) or type coordinates: 51.1523, 16.7717",
    uk: "Надішли точку на карті (📎 → Локація) або впиши координати: 51.1523, 16.7717",
  },
  loc_bad_pin: {
    pl: "Nie rozumiem. Wyślij lokalizację lub wpisz: 51.1523, 16.7717",
    en: "Didn't get that. Send a location or type: 51.1523, 16.7717",
    uk: "Не зрозумів. Надішли локацію або впиши: 51.1523, 16.7717",
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
  gamenew_date: {
    pl: "Data gry (DD.MM lub DD.MM.RRRR):",
    en: "Game date (DD.MM or DD.MM.YYYY):",
    uk: "Дата гри (ДД.ММ або ДД.ММ.РРРР):",
  },
  gamenew_bad_date: {
    pl: "Nie rozumiem daty. Format: 21.06 lub 21.06.2026",
    en: "Can't parse the date. Format: 21.06 or 21.06.2026",
    uk: "Не розумію дату. Формат: 21.06 або 21.06.2026",
  },
  gamenew_gather: {
    pl: "Godzina zbiórki (GG:MM, np. 09:00):",
    en: "Gathering time (HH:MM, e.g. 09:00):",
    uk: "Час збору (ГГ:ХХ, напр. 09:00):",
  },
  gamenew_start: {
    pl: "Godzina startu gry (GG:MM, np. 10:00):",
    en: "Game start time (HH:MM, e.g. 10:00):",
    uk: "Час старту гри (ГГ:ХХ, напр. 10:00):",
  },
  gamenew_bad_time: {
    pl: "Nie rozumiem godziny. Format: 09:00",
    en: "Can't parse the time. Format: 09:00",
    uk: "Не розумію час. Формат: 09:00",
  },
  gamenew_title: {
    pl: "Nazwa gry (łacinką, np. Fabryka cukru):",
    en: "Game title (Latin, e.g. Fabryka cukru):",
    uk: "Назва гри (латиницею, напр. Fabryka cukru):",
  },
  gamenew_scn_pl: {
    pl: "Opis/scenariusz PL:",
    en: "Description/scenario PL:",
    uk: "Опис/сценарій PL:",
  },
  gamenew_scn_uk: {
    pl: "Opis/scenariusz UA:",
    en: "Description/scenario UA:",
    uk: "Опис/сценарій UA:",
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
    pl: "🎯 {title}\n📅 {when}\n📍 {loc}\n👥 Zapisani: {count}",
    en: "🎯 {title}\n📅 {when}\n📍 {loc}\n👥 Registered: {count}",
    uk: "🎯 {title}\n📅 {when}\n📍 {loc}\n👥 Записані: {count}",
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

  // оренда + транспорт у реєстрації
  reg_rental_q: {
    pl: "Potrzebujesz wypożyczyć zestaw sprzętu?",
    en: "Do you need to rent a gear set?",
    uk: "Потрібна оренда комплекту спорядження?",
  },
  btn_yes: { pl: "Tak", en: "Yes", uk: "Так" },
  btn_no: { pl: "Nie", en: "No", uk: "Ні" },
  reg_transport_q: {
    pl: "Jak dojeżdżasz na grę?",
    en: "How are you getting to the game?",
    uk: "Як добираєшся на гру?",
  },
  btn_transport_own: { pl: "🚗 Własnym autem", en: "🚗 My own ride", uk: "🚗 Своїм ходом" },
  btn_transport_need: { pl: "🙋 Potrzebuję transportu", en: "🙋 Need a ride", uk: "🙋 Потрібен транспорт" },
  transport_need_noted: {
    pl: "Zapisane. Lista kierowców pojawi się wkrótce.",
    en: "Noted. Driver list coming soon.",
    uk: "Записано. Список водіїв з'явиться в боті незабаром.",
  },
  reg_from_q: {
    pl: "Skąd jedziesz? (dzielnica/miejsce)",
    en: "Where are you coming from? (district/place)",
    uk: "Звідки їдеш? (район/місце)",
  },
  reg_seats_q: {
    pl: "Ile wolnych miejsc możesz zabrać?",
    en: "How many free seats can you offer?",
    uk: "Скільки вільних місць можеш узяти?",
  },
  rental_noted: {
    pl: "🔫 Zaznaczyłeś wynajem — admin napisze do Ciebie ws. zestawu.",
    en: "🔫 Rental noted — an admin will message you about the set.",
    uk: "🔫 Оренду відмічено — адмін напише тобі щодо комплекту.",
  },
  admin_rental_notify: {
    pl: "🔫 {callsign} zapisał się z WYNAJMEM na «{title}» ({when}). Napisz ws. zestawu.",
    en: "🔫 {callsign} signed up with RENTAL for «{title}» ({when}). Message them about the set.",
    uk: "🔫 {callsign} записався з ОРЕНДОЮ на «{title}» ({when}). Напиши щодо комплекту.",
  },
};

export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = (S[key] && (S[key][lang] ?? S[key].en)) ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
