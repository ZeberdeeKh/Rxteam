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

  // ── 6.2 Кабінет: банери ──
  cab_welcome: {
    pl: "✅ Profil utworzony. Ustaw pseudonim, aby zapisać się na grę.",
    en: "✅ Profile created. Set a callsign to sign up for a game.",
    uk: "✅ Профіль створено. Вкажи позивний, щоб записатися на гру.",
  },
  cab_callsign_saved: { pl: "✅ Pseudonim zapisany.", en: "✅ Callsign saved.", uk: "✅ Позивний збережено." },
  cab_reg_ok: { pl: "✅ Zapisano na grę.", en: "✅ Signed up.", uk: "✅ Записано на гру." },
  cab_unreg_ok: { pl: "✅ Wypisano z gry.", en: "✅ Cancelled.", uk: "✅ Відписано." },
  cab_checkin_ok: { pl: "✅ Check-in zaliczony!", en: "✅ Checked in!", uk: "✅ Чек-ін зараховано!" },

  // ── 6.2 Кабінет: помилки ──
  err_generic: { pl: "Coś poszło nie tak.", en: "Something went wrong.", uk: "Щось пішло не так." },
  err_game_not_found: { pl: "Nie znaleziono gry.", en: "Game not found.", uk: "Гру не знайдено." },
  err_reg_closed: {
    pl: "Rejestracja na tę grę jest już zamknięta.",
    en: "Registration for this game is closed.",
    uk: "Реєстрацію на цю гру закрито.",
  },
  err_game_full: { pl: "Brak wolnych miejsc.", en: "No spots left.", uk: "Немає вільних місць." },
  err_need_callsign: {
    pl: "Najpierw ustaw pseudonim.",
    en: "Set a callsign first.",
    uk: "Спершу вкажи позивний.",
  },
  err_cancel_locked: {
    pl: "Za późno na anulowanie (mniej niż 24 godz. — to zobowiązanie).",
    en: "Too late to cancel (under 24 h — it's a commitment).",
    uk: "Запізно для скасування (менше 24 год — це зобов'язання).",
  },
  err_checkin_window: {
    pl: "Check-in jest możliwy tylko w oknie czasowym gry.",
    en: "Check-in is only possible within the game's time window.",
    uk: "Чек-ін можливий лише у часовому вікні гри.",
  },
  err_not_registered: {
    pl: "Najpierw zapisz się na grę.",
    en: "Sign up for the game first.",
    uk: "Спершу запишись на гру.",
  },
  err_too_far: {
    pl: "Jesteś za daleko od miejsca gry.",
    en: "You're too far from the game location.",
    uk: "Ти задалеко від місця гри.",
  },
  err_checkin_already: {
    pl: "Już zaliczono check-in.",
    en: "Already checked in.",
    uk: "Чек-ін уже зараховано.",
  },
  err_geo: {
    pl: "Nie udało się ustalić lokalizacji.",
    en: "Couldn't get your location.",
    uk: "Не вдалося визначити геолокацію.",
  },
  err_callsign_empty: {
    pl: "Pseudonim: 2–32 znaki.",
    en: "Callsign: 2–32 characters.",
    uk: "Позивний: 2–32 символи.",
  },
  err_callsign_taken: {
    pl: "Ten pseudonim jest już zajęty.",
    en: "That callsign is already taken.",
    uk: "Цей позивний уже зайнятий.",
  },

  // ── 6.2 Standalone / позивний ──
  standalone_title: { pl: "Graj bez Telegrama", en: "Play without Telegram", uk: "Грати без Telegram" },
  standalone_intro: {
    pl: "Nie chcesz łączyć Telegrama? Załóż profil gracza na samym e-mailu.",
    en: "Don't want to link Telegram? Create a player profile with just e-mail.",
    uk: "Не хочеш прив'язувати Telegram? Створи профіль гравця лише на e-mail.",
  },
  standalone_btn: { pl: "Utwórz profil gracza", en: "Create player profile", uk: "Створити профіль гравця" },
  or_divider: { pl: "albo", en: "or", uk: "або" },
  callsign_title: { pl: "Twój pseudonim", en: "Your callsign", uk: "Твій позивний" },
  callsign_intro: {
    pl: "Wybierz unikalny pseudonim — będzie widoczny w rankingu i na grach.",
    en: "Pick a unique callsign — shown in the ranking and at games.",
    uk: "Обери унікальний позивний — він буде в рейтингу й на іграх.",
  },
  callsign_ph: { pl: "np. Ghost", en: "e.g. Ghost", uk: "напр. Ghost" },
  callsign_btn: { pl: "Zapisz", en: "Save", uk: "Зберегти" },

  // ── 6.2 Профіль ──
  prof_section: { pl: "Profil", en: "Profile", uk: "Профіль" },
  prof_reliability: { pl: "Niezawodność", en: "Reliability", uk: "Надійність" },

  // ── 6.2 Ачівки ──
  ach_title: { pl: "Osiągnięcia", en: "Achievements", uk: "Ачівки" },
  ach_empty: { pl: "Brak osiągnięć.", en: "No achievements yet.", uk: "Поки що немає ачівок." },

  // ── 6.2 Мої ігри ──
  mygames_title: { pl: "Moje gry", en: "My games", uk: "Мої ігри" },
  mygames_empty: {
    pl: "Brak nadchodzących gier.",
    en: "No upcoming games.",
    uk: "Немає майбутніх ігор.",
  },
  regst_registered: { pl: "Zapisany", en: "Signed up", uk: "Записаний" },
  regst_cancelled: { pl: "Wypisany", en: "Cancelled", uk: "Відписаний" },
  regst_no_show: { pl: "Nieobecność", en: "No-show", uk: "Неявка" },
  game_checked_in: { pl: "✅ Check-in zaliczony", en: "✅ Checked in", uk: "✅ Чек-ін є" },
  reg_locked_info: {
    pl: "Rejestracja zamknięta",
    en: "Registration closed",
    uk: "Реєстрацію закрито",
  },
  cancel_locked_info: {
    pl: "Anulowanie niedostępne (zobowiązanie)",
    en: "Cancellation locked (commitment)",
    uk: "Скасування недоступне (зобов'язання)",
  },
  btn_register: { pl: "Zapisz się", en: "Sign up", uk: "Записатися" },
  btn_unregister: { pl: "Wypisz się", en: "Cancel", uk: "Відписатися" },
  web_checkin_btn: { pl: "Check-in (lokalizacja)", en: "Check in (location)", uk: "Чек-ін (геолокація)" },
  checkin_locating: { pl: "Ustalam lokalizację…", en: "Locating…", uk: "Визначаю геолокацію…" },
  checkin_geo_err: {
    pl: "Brak dostępu do lokalizacji.",
    en: "Location access denied.",
    uk: "Немає доступу до геолокації.",
  },

  // ── 6.2 Форма запису ──
  reg_rental_q: {
    pl: "Potrzebuję wypożyczenia sprzętu",
    en: "I need rental gear",
    uk: "Потрібна оренда спорядження",
  },
  reg_transport_q: { pl: "Transport", en: "Transport", uk: "Транспорт" },
  reg_transport_own: { pl: "Własnym transportem", en: "My own transport", uk: "Своїм ходом" },
  reg_transport_need: { pl: "Potrzebuję podwózki", en: "I need a ride", uk: "Потребую підвезти" },
  reg_from_ph: { pl: "Skąd jedziesz?", en: "Where from?", uk: "Звідки їдеш?" },
  reg_seats_ph: { pl: "Wolne miejsca w aucie", en: "Free seats in car", uk: "Вільних місць в авто" },

  // ── 6.2 Історія балів ──
  hist_title: { pl: "Historia punktów", en: "Points history", uk: "Історія балів" },
  hist_empty: { pl: "Brak historii.", en: "No history yet.", uk: "Поки що порожньо." },
  reason_attend: { pl: "Obecność na grze", en: "Game attendance", uk: "Явка на гру" },
  reason_noshow: { pl: "Nieobecność", en: "No-show", uk: "Неявка" },
  reason_friend: { pl: "Przyprowadzony znajomy", en: "Referred friend", uk: "Приведений друг" },
  reason_achievement: { pl: "Osiągnięcie", en: "Achievement", uk: "Ачівка" },
  reason_rank_purchase: { pl: "Zakup stopnia", en: "Rank purchase", uk: "Купівля звання" },
  reason_purchase: { pl: "Zakup w sklepie", en: "Shop purchase", uk: "Купівля в магазині" },
  reason_manual: { pl: "Korekta admina", en: "Admin adjustment", uk: "Корекція адміна" },

  // ── 6.3 Магазин ──
  nav_shop: { pl: "Sklep", en: "Shop", uk: "Магазин" },
  shop_title: { pl: "Sklep za punkty", en: "Points shop", uk: "Магазин за бали" },
  shop_intro: {
    pl: "Wymieniaj punkty z salda na bonusy.",
    en: "Spend your balance points on perks.",
    uk: "Витрачай бали з балансу на бонуси.",
  },
  shop_balance: { pl: "Twoje saldo", en: "Your balance", uk: "Твій баланс" },
  shop_cost: { pl: "Koszt", en: "Cost", uk: "Ціна" },
  shop_buy: { pl: "Kup", en: "Buy", uk: "Купити" },
  shop_empty: {
    pl: "Sklep jest pusty. Wkrótce dodamy bonusy.",
    en: "The shop is empty. Perks coming soon.",
    uk: "Магазин порожній. Незабаром додамо бонуси.",
  },
  shop_need_login: {
    pl: "Zaloguj się, aby kupować za punkty.",
    en: "Log in to spend points.",
    uk: "Увійди, щоб купувати за бали.",
  },
  shop_disabled: {
    pl: "Sklep jest tymczasowo wyłączony.",
    en: "The shop is temporarily disabled.",
    uk: "Магазин тимчасово вимкнено.",
  },
  shop_bought_ok: {
    pl: "✅ Zakup udany! Bonus wyda organizator.",
    en: "✅ Purchase complete! The organizer will hand out the perk.",
    uk: "✅ Покупку оформлено! Бонус видасть організатор.",
  },
  shop_err_balance: {
    pl: "Za mało punktów na saldzie.",
    en: "Not enough points on your balance.",
    uk: "Недостатньо балів на балансі.",
  },
  shop_err_inactive: {
    pl: "Ten produkt jest niedostępny.",
    en: "This item is unavailable.",
    uk: "Цей товар недоступний.",
  },
  shop_err_disabled: {
    pl: "Sklep jest tymczasowo wyłączony.",
    en: "The shop is temporarily disabled.",
    uk: "Магазин тимчасово вимкнено.",
  },
  shop_err_generic: { pl: "Coś poszło nie tak.", en: "Something went wrong.", uk: "Щось пішло не так." },

  // ── 6.4 Адмінка ──
  nav_admin: { pl: "Panel", en: "Admin", uk: "Адмінка" },
  adm_title: { pl: "Panel administracyjny", en: "Admin panel", uk: "Панель адміністратора" },
  adm_back: { pl: "← Panel", en: "← Admin", uk: "← Панель" },
  adm_saved: { pl: "✅ Zapisano.", en: "✅ Saved.", uk: "✅ Збережено." },
  adm_done: { pl: "✅ Gotowe.", en: "✅ Done.", uk: "✅ Готово." },
  adm_err_fields: { pl: "Uzupełnij pola.", en: "Fill in the fields.", uk: "Заповни поля." },

  adm_nav_settings: { pl: "Ustawienia", en: "Settings", uk: "Налаштування" },
  adm_nav_games: { pl: "Gry", en: "Games", uk: "Ігри" },
  adm_nav_players: { pl: "Gracze", en: "Players", uk: "Гравці" },
  adm_nav_referrals: { pl: "Polecenia", en: "Referrals", uk: "Реферали" },
  adm_nav_rental: { pl: "Wynajem", en: "Rental", uk: "Оренда" },
  adm_nav_joins: { pl: "Wnioski (grupa)", en: "Join requests", uk: "Заявки в групу" },
  adm_nav_roles: { pl: "Role adminów", en: "Admin roles", uk: "Ролі адмінів" },

  adm_settings_title: { pl: "Ustawienia", en: "Settings", uk: "Налаштування" },
  adm_save: { pl: "Zapisz", en: "Save", uk: "Зберегти" },
  adm_settings_hint: {
    pl: "Puste pole = używana jest wartość domyślna (pokazana szarym tekstem). Wpisz coś, aby ją nadpisać.",
    en: "Empty field = the default value is used (shown in grey). Type to override it.",
    uk: "Порожнє поле = використовується стандартне значення (показане сірим). Введи текст, щоб перекрити.",
  },

  // ── 6.4 Локації ──
  adm_nav_locations: { pl: "Lokalizacje", en: "Locations", uk: "Локації" },
  adm_locations_title: { pl: "Lokalizacje (poligony)", en: "Locations (sites)", uk: "Локації (полігони)" },
  adm_loc_add: { pl: "Nowa lokalizacja", en: "New location", uk: "Нова локація" },
  adm_loc_name: { pl: "Nazwa", en: "Name", uk: "Назва" },
  adm_loc_lat: { pl: "Szerokość (lat)", en: "Latitude", uk: "Широта (lat)" },
  adm_loc_lng: { pl: "Długość (lng)", en: "Longitude", uk: "Довгота (lng)" },
  adm_loc_radius: { pl: "Promień check-in (m)", en: "Check-in radius (m)", uk: "Радіус чек-іну (м)" },
  adm_loc_empty: { pl: "Brak zapisanych lokalizacji.", en: "No saved locations.", uk: "Немає збережених локацій." },
  adm_loc_inuse: {
    pl: "Używana w grach — nie można usunąć",
    en: "Used by games — cannot delete",
    uk: "Використовується в іграх — видалити не можна",
  },
  adm_btn_delete: { pl: "Usuń", en: "Delete", uk: "Видалити" },
  adm_btn_save: { pl: "Zapisz", en: "Save", uk: "Зберегти" },

  adm_games_title: { pl: "Gry", en: "Games", uk: "Ігри" },
  adm_game_create: { pl: "Nowa gra", en: "New game", uk: "Нова гра" },
  adm_no_locations: {
    pl: "Najpierw dodaj lokalizację w bocie (/addlocation).",
    en: "Add a location in the bot first (/addlocation).",
    uk: "Спершу додай локацію в боті (/addlocation).",
  },
  adm_f_location: { pl: "Lokalizacja", en: "Location", uk: "Локація" },
  adm_f_title: { pl: "Nazwa", en: "Title", uk: "Назва" },
  adm_f_date: { pl: "Data", en: "Date", uk: "Дата" },
  adm_f_gather: { pl: "Zbiórka (HH:MM)", en: "Gather (HH:MM)", uk: "Збір (HH:MM)" },
  adm_f_start: { pl: "Start (HH:MM)", en: "Start (HH:MM)", uk: "Старт (HH:MM)" },
  adm_f_capacity: { pl: "Limit miejsc (0 = brak)", en: "Capacity (0 = none)", uk: "Ліміт (0 = без)" },
  adm_f_scenario_pl: { pl: "Scenariusz (PL)", en: "Scenario (PL)", uk: "Сценарій (PL)" },
  adm_f_scenario_uk: { pl: "Scenariusz (UA)", en: "Scenario (UA)", uk: "Сценарій (UA)" },
  adm_btn_create: { pl: "Utwórz", en: "Create", uk: "Створити" },
  adm_btn_cancel_game: { pl: "Odwołaj", en: "Cancel", uk: "Скасувати" },
  adm_open: { pl: "Otwórz", en: "Open", uk: "Відкрити" },
  adm_col_status: { pl: "Status", en: "Status", uk: "Статус" },
  adm_col_reg: { pl: "Zapisani", en: "Registered", uk: "Записані" },
  adm_col_checkins: { pl: "Check-iny", en: "Check-ins", uk: "Чек-іни" },

  adm_game_regs: { pl: "Zapisani gracze", en: "Registered players", uk: "Записані гравці" },
  adm_no_regs: { pl: "Brak zapisanych.", en: "No registrations.", uk: "Немає записаних." },
  adm_btn_checkin: { pl: "Check-in", en: "Check in", uk: "Чек-ін" },
  adm_btn_noshow: { pl: "Nieobecność", en: "No-show", uk: "Неявка" },
  adm_checked: { pl: "✅ obecny", en: "✅ present", uk: "✅ присутній" },
  adm_rental_flag: { pl: "🔫 wynajem", en: "🔫 rental", uk: "🔫 оренда" },

  adm_players_title: { pl: "Gracze", en: "Players", uk: "Гравці" },
  adm_balance: { pl: "Saldo", en: "Balance", uk: "Баланс" },
  adm_earned: { pl: "Zarobione", en: "Earned", uk: "Зароблено" },
  adm_games_n: { pl: "Gry", en: "Games", uk: "Ігри" },
  adm_btn_adjust: { pl: "Koryguj", en: "Adjust", uk: "Корекція" },
  adm_delta_ph: { pl: "±punkty", en: "±points", uk: "±бали" },
  adm_btn_patch: { pl: "Patch ↔", en: "Patch ↔", uk: "Patch ↔" },
  adm_btn_callsign: { pl: "Pseudonim", en: "Callsign", uk: "Позивний" },

  adm_referrals_title: { pl: "Polecenia", en: "Referrals", uk: "Реферали" },
  adm_inviter: { pl: "Zapraszający", en: "Inviter", uk: "Запросив" },
  adm_invited: { pl: "Nowy", en: "Newcomer", uk: "Новачок" },
  adm_btn_confirm: { pl: "Potwierdź", en: "Confirm", uk: "Підтвердити" },
  adm_btn_reject: { pl: "Odrzuć", en: "Reject", uk: "Відхилити" },
  adm_empty: { pl: "Brak danych.", en: "No data.", uk: "Немає даних." },

  adm_rental_title: { pl: "Zgłoszenia wynajmu", en: "Rental requests", uk: "Заявки на оренду" },
  adm_rental_note: {
    pl: "Lista podglądowa. Status (zajęty/opłacony) prowadź poza systemem.",
    en: "Read-only list. Track status (occupied/paid) outside the system.",
    uk: "Список лише для перегляду. Статус (зайнято/оплачено) веди поза системою.",
  },

  adm_joins_title: { pl: "Wnioski do grupy (shield)", en: "Group join requests", uk: "Заявки в групу" },
  adm_joins_note: {
    pl: "Decyzje podejmuje bot automatycznie (captcha). Tu podgląd ostatnich.",
    en: "Decisions are automatic (captcha). Recent attempts shown here.",
    uk: "Рішення приймає бот автоматично (капча). Тут перегляд останніх.",
  },

  adm_roles_title: { pl: "Role adminów", en: "Admin roles", uk: "Ролі адмінів" },
  adm_master: { pl: "Master", en: "Master", uk: "Майстер" },
  adm_btn_save_roles: { pl: "Zapisz role", en: "Save roles", uk: "Зберегти ролі" },
  adm_roles_help: {
    pl: "Zaznacz uprawnienia i kliknij „Zapisz role”. Każde uprawnienie czyni gracza adminem; odznacz wszystkie i zapisz — wraca do roli zwykłego gracza.",
    en: "Tick permissions and click “Save roles”. Any permission makes the player an admin; clear them all and save to demote back to a regular player.",
    uk: "Відмітьте права й натисніть «Зберегти ролі». Будь-яке право робить гравця адміном; зніміть усі й збережіть — і він знову звичайний гравець.",
  },
  adm_role_admin: { pl: "Admin", en: "Admin", uk: "Адмін" },
  adm_role_player: { pl: "Gracz", en: "Player", uk: "Гравець" },

  // Легенда дозволів (показується внизу «Ролі адмінів», лише майстру).
  adm_perms_legend_title: {
    pl: "Co oznaczają uprawnienia",
    en: "What the permissions mean",
    uk: "Що означають дозволи",
  },
  adm_perm_games: {
    pl: "tworzenie i odwoływanie gier, zarządzanie lokalizacjami.",
    en: "create and cancel games, manage locations.",
    uk: "створення й скасування ігор, керування локаціями.",
  },
  adm_perm_rental: {
    pl: "podgląd zgłoszeń wynajmu sprzętu.",
    en: "view equipment rental requests.",
    uk: "перегляд заявок на оренду спорядження.",
  },
  adm_perm_checkin: {
    pl: "ręczne odhaczanie obecności graczy, eksport check-inów.",
    en: "manually mark player attendance, export check-ins.",
    uk: "ручне відмічання присутності гравців, експорт чек-інів.",
  },
  adm_perm_referrals: {
    pl: "zatwierdzanie i odrzucanie poleceń.",
    en: "confirm and reject referrals.",
    uk: "підтвердження й відхилення рефералів.",
  },
  adm_perm_players: {
    pl: "korekta punktów/salda, patch, zmiana pseudonimu, eksport graczy.",
    en: "adjust points/balance, patch, change callsign, export players.",
    uk: "корекція балів/балансу, патч, зміна позивного, експорт гравців.",
  },
  adm_perm_joins: {
    pl: "podgląd zgłoszeń dołączenia do grupy.",
    en: "view group join attempts.",
    uk: "перегляд заявок на приєднання до групи.",
  },

  adm_export: { pl: "Eksport CSV", en: "CSV export", uk: "Експорт CSV" },
  adm_export_players: { pl: "Gracze", en: "Players", uk: "Гравці" },
  adm_export_regs: { pl: "Rejestracje", en: "Registrations", uk: "Реєстрації" },
  adm_export_checkins: { pl: "Check-iny", en: "Check-ins", uk: "Чек-іни" },

  // ── Перемикач теми ──
  theme_toggle: { pl: "Motyw", en: "Theme", uk: "Тема" },

  // ── Етап 9: «Повідомити про помилку» (перенесено з Kalkulator) ──
  bug_button: { pl: "Zgłoś błąd", en: "Report a bug", uk: "Повідомити про помилку" },
  bug_title: { pl: "Zgłoś błąd", en: "Report a bug", uk: "Повідомити про помилку" },
  bug_desc_ph: {
    pl: "Opisz problem — co się stało i jak to powtórzyć…",
    en: "Describe the problem — what happened and how to reproduce it…",
    uk: "Опишіть проблему — що сталося і як це відтворити…",
  },
  bug_email: {
    pl: "E-mail lub nick w Telegramie (opcjonalnie)",
    en: "Email or Telegram username (optional)",
    uk: "E-mail або нік у Telegram (необов'язково)",
  },
  bug_attach: { pl: "Dołącz zrzut ekranu", en: "Attach screenshot", uk: "Прикріпити знімок екрана" },
  bug_screenshot_hint: { pl: "PNG, JPG · do 5 MB", en: "PNG, JPG · up to 5 MB", uk: "PNG, JPG · до 5 МБ" },
  bug_remove: { pl: "Usuń zrzut ekranu", en: "Remove screenshot", uk: "Видалити знімок екрана" },
  bug_too_large: { pl: "Plik jest za duży (maks. 5 MB)", en: "File is too large (max 5 MB)", uk: "Файл завеликий (макс. 5 МБ)" },
  bug_invalid_image: { pl: "Wybierz plik graficzny", en: "Please select an image file", uk: "Виберіть файл зображення" },
  bug_send: { pl: "Wyślij", en: "Send", uk: "Надіслати" },
  bug_cancel: { pl: "Anuluj", en: "Cancel", uk: "Скасувати" },
  bug_success: { pl: "Dziękujemy! Zgłoszenie wysłane.", en: "Thanks! Your report was sent.", uk: "Дякуємо! Звіт надіслано." },
  bug_success_hint: {
    pl: "Dziękujemy, że pomagasz ulepszać serwis.",
    en: "Thank you for helping us make the service better.",
    uk: "Дякуємо, що допомагаєте робити сервіс кращим.",
  },
  bug_close: { pl: "Zamknij", en: "Close", uk: "Закрити" },
  bug_error: { pl: "Nie udało się wysłać. Spróbuj ponownie.", en: "Could not send. Please try again.", uk: "Не вдалося надіслати. Спробуйте ще раз." },
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
