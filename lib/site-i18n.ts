// i18n сайту (PL/EN/UA) — окремо від bot-текстів (lib/strings.ts), але та сама мовна модель.
// ЧИСТИЙ модуль: жодних next/headers — можна імпортувати і в клієнт-, і в серверкомпонентах.
import type { Lang } from "./i18n";

export type { Lang };
export const SITE_LANGS: Lang[] = ["pl", "en", "uk"];
export const LANG_COOKIE = "rx_lang";

export const LANG_LABEL: Record<Lang, string> = {
  pl: "Polski",
  en: "English",
  uk: "Українська",
};
export const LANG_FLAG: Record<Lang, string> = { pl: "🇵🇱", en: "🇬🇧", uk: "🇺🇦" };

type Dict = Record<Lang, string>;

// UI-тексти сайту. Розширюємо по під-етапах (6.1+).
const SITE: Record<string, Dict> = {
  brand_tagline: {
    pl: "ASG / Airsoft — Wrocław",
    en: "ASG / Airsoft — Wrocław",
    uk: "ASG / Airsoft — Wrocław",
  },
  nav_home: { pl: "Start", en: "Home", uk: "Головна" },
  nav_games: { pl: "Gry", en: "Games", uk: "Ігри" },
  nav_ranking: { pl: "Ranking", en: "Ranking", uk: "Рейтинг" },
  nav_cabinet: { pl: "Mój profil", en: "My profile", uk: "Кабінет" },
  nav_login: { pl: "Zaloguj", en: "Log in", uk: "Увійти" },
  nav_logout: { pl: "Wyloguj", en: "Log out", uk: "Вийти" },
  nav_register: { pl: "Rejestracja", en: "Sign up", uk: "Реєстрація" },

  footer_note: {
    pl: "Nieformalna grupa znajomych grających w ASG dla zabawy.",
    en: "An informal group of friends playing ASG for fun.",
    uk: "Неформальна група друзів, що грають в ASG для розваги.",
  },

  home_title: { pl: "RX Team", en: "RX Team", uk: "RX Team" },
  home_intro: {
    pl: "Strona w budowie. Wkrótce: najbliższa gra, kalendarz, ranking i Twój profil. 🪖",
    en: "Site under construction. Coming soon: next game, calendar, ranking and your profile. 🪖",
    uk: "Сайт у розробці. Незабаром: найближча гра, календар, рейтинг і твій кабінет. 🪖",
  },

  lang_switch: { pl: "Język", en: "Language", uk: "Мова" },

  // ── Auth ──
  auth_email: { pl: "E-mail", en: "E-mail", uk: "E-mail" },
  auth_password: { pl: "Hasło", en: "Password", uk: "Пароль" },
  auth_login_title: { pl: "Logowanie", en: "Log in", uk: "Вхід" },
  auth_register_title: { pl: "Rejestracja", en: "Sign up", uk: "Реєстрація" },
  auth_login_btn: { pl: "Zaloguj się", en: "Log in", uk: "Увійти" },
  auth_register_btn: { pl: "Załóż konto", en: "Create account", uk: "Створити акаунт" },
  auth_to_register: {
    pl: "Nie masz konta? Zarejestruj się",
    en: "No account? Sign up",
    uk: "Немає акаунта? Зареєструйся",
  },
  auth_to_login: {
    pl: "Masz już konto? Zaloguj się",
    en: "Already have an account? Log in",
    uk: "Уже є акаунт? Увійди",
  },
  auth_min_pass: {
    pl: "Min. 8 znaków.",
    en: "Min. 8 characters.",
    uk: "Мін. 8 символів.",
  },
  auth_check_email_title: {
    pl: "Sprawdź skrzynkę",
    en: "Check your inbox",
    uk: "Перевір пошту",
  },
  auth_check_email_body: {
    pl: "Wysłaliśmy link potwierdzający na Twój e-mail. Kliknij go, aby aktywować konto.",
    en: "We sent a confirmation link to your e-mail. Click it to activate your account.",
    uk: "Ми надіслали лист із підтвердженням на твій e-mail. Перейди за посиланням, щоб активувати акаунт.",
  },
  auth_confirmed: {
    pl: "✅ E-mail potwierdzony. Jesteś zalogowany.",
    en: "✅ E-mail confirmed. You're logged in.",
    uk: "✅ E-mail підтверджено. Ти увійшов.",
  },
  auth_confirm_failed: {
    pl: "Nie udało się potwierdzić linku (wygasł lub jest nieprawidłowy).",
    en: "Couldn't confirm the link (expired or invalid).",
    uk: "Не вдалося підтвердити посилання (прострочене або недійсне).",
  },
  auth_or: { pl: "albo", en: "or", uk: "або" },
  auth_tg_hint: {
    pl: "Masz konto w bocie? Zaloguj się jednym kliknięciem:",
    en: "Have a bot account? Log in with one click:",
    uk: "Є акаунт у боті? Увійди в один клік:",
  },
  auth_err_tg: {
    pl: "Logowanie przez Telegram nie powiodło się. Spróbuj ponownie.",
    en: "Telegram login failed. Please try again.",
    uk: "Вхід через Telegram не вдався. Спробуй ще раз.",
  },
  auth_err_generic: {
    pl: "Coś poszło nie tak. Spróbuj ponownie.",
    en: "Something went wrong. Try again.",
    uk: "Щось пішло не так. Спробуй ще раз.",
  },
  cabinet_title: { pl: "Mój profil", en: "My profile", uk: "Кабінет" },

  // ── Лінк Telegram ──
  link_title: { pl: "Połącz z Telegramem", en: "Link Telegram", uk: "Прив'язати Telegram" },
  link_intro: {
    pl: "Masz już profil w bocie? Połącz go, aby mieć wspólną historię, punkty i stopień.",
    en: "Already have a profile in the bot? Link it to share history, points and rank.",
    uk: "Уже маєш профіль у боті? Прив'яжи його, щоб історія, бали й звання були спільні.",
  },
  link_how: {
    pl: "W bocie wpisz /linksite, skopiuj kod i wklej go poniżej (ważny 15 min).",
    en: "In the bot type /linksite, copy the code and paste it below (valid 15 min).",
    uk: "У боті введи /linksite, скопіюй код і встав його нижче (діє 15 хв).",
  },
  link_code_label: { pl: "Kod łączący", en: "Link code", uk: "Код прив'язки" },
  link_btn: { pl: "Połącz", en: "Link", uk: "Прив'язати" },
  link_ok: {
    pl: "✅ Połączono z Telegramem.",
    en: "✅ Linked to Telegram.",
    uk: "✅ Прив'язано до Telegram.",
  },
  link_err_not_found: {
    pl: "Nieprawidłowy kod.",
    en: "Invalid code.",
    uk: "Невірний код.",
  },
  link_err_expired: { pl: "Kod wygasł. Wygeneruj nowy w bocie.", en: "Code expired. Generate a new one in the bot.", uk: "Код прострочено. Згенеруй новий у боті." },
  link_err_used: { pl: "Kod już użyty.", en: "Code already used.", uk: "Код уже використано." },
  link_err_taken: {
    pl: "To konto jest już połączone z innym profilem.",
    en: "This account is already linked to another profile.",
    uk: "Цей акаунт уже прив'язаний до іншого профілю.",
  },

  // ── Профіль (мінімум для 6.0) ──
  prof_callsign: { pl: "Pseudonim", en: "Callsign", uk: "Позивний" },
  prof_rank: { pl: "Stopień", en: "Rank", uk: "Звання" },
  prof_earned: { pl: "Zarobione", en: "Earned", uk: "Зароблено" },
  prof_balance: { pl: "Saldo", en: "Balance", uk: "Баланс" },
  prof_games: { pl: "Rozegrane gry", en: "Games played", uk: "Зіграно ігор" },
  prof_no_rank: { pl: "brak (potrzebny patch)", en: "none (patch needed)", uk: "немає (потрібен патч)" },

  // ── 6.1 Лендінг ──
  home_hero_sub: {
    pl: "Społeczność ASG we Wrocławiu. Gry, ranking i Twój profil w jednym miejscu.",
    en: "An ASG community in Wrocław. Games, ranking and your profile in one place.",
    uk: "Спільнота ASG у Вроцлаві. Ігри, рейтинг і твій профіль в одному місці.",
  },
  home_cta_games: { pl: "Zobacz gry", en: "See games", uk: "Переглянути ігри" },
  home_cta_ranking: { pl: "Ranking", en: "Ranking", uk: "Рейтинг" },
  home_next_title: { pl: "Najbliższa gra", en: "Next game", uk: "Найближча гра" },
  home_next_none: {
    pl: "Brak zaplanowanych gier. Zajrzyj wkrótce. 🪖",
    en: "No games scheduled yet. Check back soon. 🪖",
    uk: "Поки що немає запланованих ігор. Зазирни пізніше. 🪖",
  },
  home_skladka_title: { pl: "Składka", en: "Voluntary contribution (składka)", uk: "Внесок (składka)" },
  // Текст складки — PL дослівно (§15 PLAN.md). Однаковий для всіх мов інтерфейсу.
  home_skladka_body: {
    pl: "RX Team to nieformalna grupa znajomych grających w ASG dla zabawy. Podana kwota to dobrowolna składka przeznaczona w całości na rozwój i utrzymanie wspólnego sprzętu wykorzystywanego podczas gier. Nie prowadzimy działalności zarobkowej ani komercyjnej i nie świadczymy usług — zbiórka ma charakter koleżeński (zrzutka na sprzęt).",
    en: "RX Team to nieformalna grupa znajomych grających w ASG dla zabawy. Podana kwota to dobrowolna składka przeznaczona w całości na rozwój i utrzymanie wspólnego sprzętu wykorzystywanego podczas gier. Nie prowadzimy działalności zarobkowej ani komercyjnej i nie świadczymy usług — zbiórka ma charakter koleżeński (zrzutka na sprzęt).",
    uk: "RX Team to nieformalna grupa znajomych grających w ASG dla zabawy. Podana kwota to dobrowolna składka przeznaczona w całości na rozwój i utrzymanie wspólnego sprzętu wykorzystywanego podczas gier. Nie prowadzimy działalności zarobkowej ani komercyjnej i nie świadczymy usług — zbiórka ma charakter koleżeński (zrzutka na sprzęt).",
  },

  // ── 6.1 Ігри ──
  games_title: { pl: "Gry", en: "Games", uk: "Ігри" },
  games_next_heading: { pl: "Najbliższa gra", en: "Next game", uk: "Найближча гра" },
  games_upcoming_heading: { pl: "Nadchodzące gry", en: "Upcoming games", uk: "Майбутні ігри" },
  games_past_heading: { pl: "Minione gry", en: "Past games", uk: "Минулі ігри" },
  games_none_upcoming: {
    pl: "Brak nadchodzących gier.",
    en: "No upcoming games.",
    uk: "Немає майбутніх ігор.",
  },
  games_none_past: { pl: "Brak minionych gier.", en: "No past games.", uk: "Немає минулих ігор." },
  games_label_when: { pl: "Termin", en: "When", uk: "Коли" },
  games_label_where: { pl: "Lokalizacja", en: "Location", uk: "Локація" },
  games_label_signed: { pl: "Zapisani", en: "Signed up", uk: "Записані" },
  games_count: { pl: "{n} zapisanych", en: "{n} signed up", uk: "{n} записаних" },
  games_count_cap: { pl: "{n}/{cap} zapisanych", en: "{n}/{cap} signed up", uk: "{n}/{cap} записаних" },
  games_map: { pl: "Mapa", en: "Map", uk: "Карта" },
  games_tbd_loc: { pl: "Lokalizacja w trakcie ustalania", en: "Location TBD", uk: "Локація уточнюється" },

  // ── 6.1 Рейтинг ──
  ranking_title: { pl: "Ranking", en: "Ranking", uk: "Рейтинг" },
  ranking_intro: {
    pl: "Najlepsi gracze według „zarobione łącznie”.",
    en: "Top players by total points earned.",
    uk: "Найкращі гравці за «зароблено всього».",
  },
  ranking_col_pos: { pl: "#", en: "#", uk: "#" },
  ranking_col_player: { pl: "Gracz", en: "Player", uk: "Гравець" },
  ranking_col_rank: { pl: "Stopień", en: "Rank", uk: "Звання" },
  ranking_col_earned: { pl: "Zarobione", en: "Earned", uk: "Зароблено" },
  ranking_col_games: { pl: "Gry", en: "Games", uk: "Ігри" },
  ranking_empty: {
    pl: "Brak danych do rankingu.",
    en: "No ranking data yet.",
    uk: "Поки що немає даних для рейтингу.",
  },
  ranking_note_top: {
    pl: "Pokazujemy najlepszą dziesiątkę.",
    en: "Showing the top 10.",
    uk: "Показуємо найкращу десятку.",
  },
  ranking_anon: { pl: "Gracz", en: "Player", uk: "Гравець" },
};

export function st(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = (SITE[key] && (SITE[key][lang] ?? SITE[key].en)) ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

// Вибір мови сайту: cookie має пріоритет, далі Accept-Language, далі uk.
export function resolveLang(cookieVal?: string | null, acceptLang?: string | null): Lang {
  if (cookieVal && (SITE_LANGS as string[]).includes(cookieVal)) return cookieVal as Lang;
  const al = (acceptLang ?? "").toLowerCase();
  if (al.startsWith("pl") || al.includes(",pl") || al.includes(" pl")) return "pl";
  if (al.startsWith("en") || al.includes(",en") || al.includes(" en")) return "en";
  return "uk";
}
