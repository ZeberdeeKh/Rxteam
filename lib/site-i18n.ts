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
  auth_err_generic: {
    pl: "Coś poszło nie tak. Spróbuj ponownie.",
    en: "Something went wrong. Try again.",
    uk: "Щось пішло не так. Спробуй ще раз.",
  },
  cabinet_title: { pl: "Mój profil", en: "My profile", uk: "Кабінет" },
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
