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
  nav_mygames: { pl: "Moje gry", en: "My games", uk: "Мої ігри" },
  nav_login: { pl: "Zaloguj", en: "Log in", uk: "Увійти" },
  nav_logout: { pl: "Wyloguj", en: "Log out", uk: "Вийти" },
  nav_register: { pl: "Rejestracja", en: "Sign up", uk: "Реєстрація" },
  nav_gallery: { pl: "Galeria", en: "Gallery", uk: "Галерея" },

  footer_note: {
    pl: "Nieformalna społeczność miłośników ASG z Wrocławia.",
    en: "An informal community of ASG enthusiasts in Wrocław.",
    uk: "Неформальна спільнота поціновувачів ASG із Вроцлава.",
  },

  // <meta name="description"> — слідує мові сайту (app/layout.tsx → generateMetadata).
  meta_description: {
    pl: "Społeczność ASG / Airsoft — Wrocław",
    en: "ASG / Airsoft community — Wrocław",
    uk: "Спільнота ASG / Airsoft — Wrocław",
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
  auth_tg_btn: {
    pl: "Zaloguj się przez Telegram",
    en: "Log in with Telegram",
    uk: "Увійти через Telegram",
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
  // Помилки реєстрації/входу — мапимо raw-повідомлення Supabase на ці ключі (app/auth/actions.ts),
  // інакше англомовний бекенд-текст витікав би в UI повз словник.
  auth_err_email_taken: {
    pl: "Ten e-mail jest już zarejestrowany. Zaloguj się.",
    en: "This e-mail is already registered. Please log in.",
    uk: "Ця пошта вже зареєстрована. Увійди.",
  },
  auth_err_rate_limit: {
    pl: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
    en: "Too many attempts. Please try again shortly.",
    uk: "Забагато спроб. Спробуй ще раз за хвилину.",
  },
  auth_err_email_invalid: {
    pl: "Nieprawidłowy adres e-mail.",
    en: "Invalid e-mail address.",
    uk: "Неправильна адреса e-mail.",
  },
  auth_err_bad_creds: {
    pl: "Nieprawidłowy e-mail lub hasło.",
    en: "Invalid e-mail or password.",
    uk: "Неправильний e-mail або пароль.",
  },
  auth_err_not_confirmed: {
    pl: "Najpierw potwierdź adres e-mail (sprawdź skrzynkę).",
    en: "Please confirm your e-mail first (check your inbox).",
    uk: "Спершу підтверди e-mail (перевір пошту).",
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
    uk: "Неправильний код.",
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
  // Блок «Про нас» на лендінгу (замість складки) + соцмережі.
  home_about_title: { pl: "O nas", en: "About us", uk: "Про нас" },
  home_about_body: {
    pl: "RX Team to nieformalna społeczność miłośników ASG z Wrocławia. Nie jesteśmy firmą ani oficjalną organizacją — gramy z pasji, dla wspólnej frajdy. Spotykamy się na grach w każdą niedzielę, z wyjątkiem niektórych świąt. Wszystkie aktualności znajdziesz na naszym Instagramie, Telegramie, Facebooku i TikToku — linki poniżej.",
    en: "RX Team is an informal community of ASG enthusiasts from Wrocław. We're not a company or an official organisation — we play out of passion, for the shared fun of it. We meet for games every Sunday, except some holidays. You'll find all the latest news on our Instagram, Telegram, Facebook and TikTok — links below.",
    uk: "RX Team — неформальна спільнота поціновувачів ASG із Вроцлава. Ми не компанія й не офіційна організація — граємо із пристрасті, заради спільного драйву. Збираємося на ігри щонеділі, окрім деяких свят. Усі новини шукай у нашому Instagram, Telegram, Facebook і TikTok — посилання нижче.",
  },
  social_soon: { pl: "wkrótce", en: "soon", uk: "скоро" },
  home_social_title: { pl: "Sociale", en: "Socials", uk: "Соцмережі" },

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
  games_announce_heading: { pl: "Opis gry", en: "Game description", uk: "Опис гри" },
  games_show_more: { pl: "Pokaż całość", en: "Show more", uk: "Показати повністю" },
  games_show_less: { pl: "Zwiń", en: "Show less", uk: "Згорнути" },
  games_login_to_register: {
    pl: "Zaloguj się, aby się zapisać",
    en: "Log in to sign up",
    uk: "Увійдіть, щоб записатися",
  },
  games_need_callsign: {
    pl: "Ustaw pseudonim w profilu, aby się zapisać",
    en: "Set a callsign in your profile to sign up",
    uk: "Задайте позивний у кабінеті, щоб записатися",
  },
  games_reg_closed: { pl: "Zapisy zamknięte", en: "Registration closed", uk: "Реєстрацію закрито" },

  // ── Галерея (Етап 15) ──
  gallery_title: { pl: "Galeria zdjęć", en: "Photo gallery", uk: "Галерея фото" },
  gallery_intro: {
    pl: "Losowy wybór zdjęć z naszych gier.",
    en: "A random selection of shots from our games.",
    uk: "Випадкова добірка фото з наших ігор.",
  },
  gallery_empty: {
    pl: "Brak zdjęć — wkrótce pojawią się nowe.",
    en: "No photos yet — check back soon.",
    uk: "Поки що порожньо — скоро з'являться фото.",
  },
  gallery_close: { pl: "Zamknij", en: "Close", uk: "Закрити" },
  gallery_prev: { pl: "Poprzednie zdjęcie", en: "Previous photo", uk: "Попереднє фото" },
  gallery_next: { pl: "Następne zdjęcie", en: "Next photo", uk: "Наступне фото" },

  // ── 6.1 Рейтинг ──
  ranking_title: { pl: "Ranking", en: "Ranking", uk: "Рейтинг" },
  ranking_intro: {
    pl: "Pierwsza dziesiątka graczy według „zarobionych punktów łącznie”.",
    en: "Top ten players by total points earned.",
    uk: "Перша десятка гравців за «зароблено всього балів».",
  },
  ranking_col_pos: { pl: "#", en: "#", uk: "#" },
  ranking_col_player: { pl: "Gracz", en: "Player", uk: "Гравець" },
  ranking_col_rank: { pl: "Stopień", en: "Rank", uk: "Звання" },
  ranking_col_earned: { pl: "Zarobione", en: "Earned", uk: "Зароблено" },
  ranking_col_games: { pl: "Gry", en: "Games", uk: "Ігри" },
  ranking_col_ach: { pl: "Osiągnięcia", en: "Achievements", uk: "Ачівки" },
  ranking_empty: {
    pl: "Na razie nikogo nie ma w rankingu.",
    en: "No one in the ranking yet.",
    uk: "У рейтингу поки що нікого немає.",
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
  ach_earned: { pl: "Zdobyto", en: "Earned", uk: "Отримано" },

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
  // Статуси гри (адмін-пігулки) — ADR-0025
  gamest_announced: { pl: "Ogłoszona", en: "Announced", uk: "Анонсована" },
  gamest_cancelled: { pl: "Odwołana", en: "Cancelled", uk: "Скасована" },
  gamest_draft: { pl: "Szkic", en: "Draft", uk: "Чернетка" },
  gamest_finished: { pl: "Zakończona", en: "Finished", uk: "Завершена" },
  // Статуси заявки на вступ (анти-бот шилд)
  joinst_passed: { pl: "Zaliczona", en: "Passed", uk: "Пройдено" },
  joinst_pending: { pl: "Oczekuje", en: "Pending", uk: "Очікує" },
  joinst_failed: { pl: "Niezaliczona", en: "Failed", uk: "Не пройдено" },
  joinst_declined: { pl: "Odrzucona", en: "Declined", uk: "Відхилено" },
  // Статуси реферала — ADR-0025
  refst_confirmed: { pl: "Potwierdzony", en: "Confirmed", uk: "Підтверджено" },
  refst_rejected: { pl: "Odrzucony", en: "Rejected", uk: "Відхилено" },
  refst_pending: { pl: "Oczekuje", en: "Pending", uk: "Очікує" },
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
  reg_transport_own: { pl: "Własnym autem, podwiozę", en: "Driving, can give a lift", uk: "Своїм авто, підвезу" },
  reg_transport_need: { pl: "Potrzebuję podwózki", en: "I need a ride", uk: "Потрібен транспорт" },
  reg_transport_skip: { pl: "Pomiń (bez transportu)", en: "Skip (no transport)", uk: "Пропустити (без транспорту)" },
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
    pl: "Zdobywaj punkty na grach, eventach i za znajomych zaproszonych przez link polecający — a tutaj wymieniaj je na bonusy i stopnie.",
    en: "Earn points at games, special events and for friends invited via your referral link — then spend them here on perks and ranks.",
    uk: "Заробляй бали на іграх, спеціальних подіях і за друзів, запрошених через реф-посилання, — а тут обмінюй їх на корисні бонуси та звання.",
  },
  shop_items_title: { pl: "Bonusy", en: "Perks", uk: "Бонуси" },
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

  // ── Звання в магазині (купівля наступного — правила як у боті /rank) ──
  shop_ranks_title: { pl: "Stopnie", en: "Ranks", uk: "Звання" },
  shop_ranks_intro: {
    pl: "Kupuj kolejne stopnie za punkty. Wymagany patch; stopnie zdobywasz po kolei.",
    en: "Buy higher ranks with points. Patch required; ranks unlock one by one.",
    uk: "Купуй вищі звання за бали. Потрібен патч; звання відкриваються по черзі.",
  },
  shop_rank_free: {
    pl: "W zestawie z patchem",
    en: "Included with the patch",
    uk: "Входить із патчем",
  },
  shop_rank_current: { pl: "Aktualny", en: "Current", uk: "Поточне" },
  shop_rank_owned: { pl: "Zdobyty", en: "Owned", uk: "Отримано" },
  shop_rank_need_patch: {
    pl: "Stopnie są dostępne po odebraniu patcha (członkostwo).",
    en: "Ranks unlock once you receive the patch (membership).",
    uk: "Звання доступні після отримання патча (членство).",
  },
  shop_rank_bought_ok: {
    pl: "🎉 Gratulacje! Masz nowy stopień.",
    en: "🎉 Congrats! You have a new rank.",
    uk: "🎉 Вітаємо! У тебе нове звання.",
  },
  shop_err_rank_need_patch: {
    pl: "Najpierw odbierz patch, aby kupować stopnie.",
    en: "Get the patch first to buy ranks.",
    uk: "Спершу отримай патч, щоб купувати звання.",
  },
  shop_err_rank_max: {
    pl: "Masz już najwyższy stopień.",
    en: "You already have the top rank.",
    uk: "У тебе вже максимальне звання.",
  },
  shop_err_rank_balance: {
    pl: "Za mało punktów na ten stopień.",
    en: "Not enough points for this rank.",
    uk: "Недостатньо балів на це звання.",
  },
  shop_err_rank_changed: {
    pl: "Stopień się zmienił — odśwież stronę.",
    en: "Your rank changed — refresh the page.",
    uk: "Звання змінилося — онови сторінку.",
  },
  shop_err_rank_econ_off: {
    pl: "Ekonomia punktów jest wyłączona.",
    en: "The points economy is disabled.",
    uk: "Економіку балів вимкнено.",
  },

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
  adm_nav_chores: { pl: "Czek-lista", en: "Checklist", uk: "Чек-лист" },
  adm_nav_export: { pl: "Eksport", en: "Export", uk: "Експорт" },
  adm_nav_gallery: { pl: "Galeria", en: "Gallery", uk: "Галерея" },

  // ── Фото-галерея (Етап 15) ──
  adm_gallery_title: { pl: "Galeria zdjęć", en: "Photo gallery", uk: "Галерея фото" },
  adm_gallery_empty: { pl: "Brak zdjęć w galerii.", en: "No photos in the gallery yet.", uk: "У галереї поки немає фото." },
  adm_gallery_upload_title: { pl: "Dodaj zdjęcia", en: "Add photos", uk: "Додати фото" },
  adm_gallery_caption_ph: { pl: "Podpis (opcjonalnie)", en: "Caption (optional)", uk: "Підпис (необов'язково)" },
  adm_gallery_uploading: { pl: "Wgrywanie…", en: "Uploading…", uk: "Завантаження…" },
  adm_gallery_uploaded: { pl: "✅ Dodano: {n}", en: "✅ Added: {n}", uk: "✅ Додано: {n}" },
  adm_gallery_upload_err: { pl: "Nie udało się wgrać.", en: "Upload failed.", uk: "Не вдалося завантажити." },
  adm_gallery_upload_hint: {
    pl: "JPG, PNG · maks. 1 MB na plik (limit magazynu). Można zaznaczyć kilka naraz.",
    en: "JPG, PNG · max 1 MB per file (storage limit). You can select several at once.",
    uk: "JPG, PNG · макс. 1 МБ на файл (ліміт сховища). Можна обрати кілька одразу.",
  },
  adm_gallery_oversize: {
    pl: "Plików > 1 MB: {n} — zostaną pominięte (limit magazynu).",
    en: "Files over 1 MB: {n} — they will be skipped (storage limit).",
    uk: "Файлів > 1 МБ: {n} — їх буде пропущено (ліміт сховища).",
  },
  adm_gallery_skipped: {
    pl: "pominięto {n} (> 1 MB)",
    en: "skipped {n} (> 1 MB)",
    uk: "пропущено {n} (> 1 МБ)",
  },
  adm_gallery_all_big: {
    pl: "Wszystkie pliki są za duże (maks. 1 MB). Skompresuj je i spróbuj ponownie.",
    en: "All files are too large (max 1 MB). Compress them and try again.",
    uk: "Усі файли завеликі (макс. 1 МБ). Стисни їх і спробуй ще раз.",
  },
  adm_gallery_st_visible: { pl: "Widoczne", en: "Visible", uk: "Видиме" },
  adm_gallery_st_hidden: { pl: "Ukryte", en: "Hidden", uk: "Приховане" },
  adm_btn_upload: { pl: "Wgraj", en: "Upload", uk: "Завантажити" },
  adm_btn_hide: { pl: "Ukryj", en: "Hide", uk: "Сховати" },
  adm_btn_show: { pl: "Pokaż", en: "Show", uk: "Показати" },

  adm_settings_title: { pl: "Ustawienia", en: "Settings", uk: "Налаштування" },
  adm_save: { pl: "Zapisz", en: "Save", uk: "Зберегти" },

  // ── Соцмережі (майстер) ──
  adm_social_title: { pl: "Sociale (linki)", en: "Socials (links)", uk: "Соцмережі (посилання)" },

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

  // ── Ліміти локації: типи реплік, піро, режим вогню ──
  adm_loc_replicas: {
    pl: "Dozwolone repliki (do anonsu)",
    en: "Allowed replicas (for the announcement)",
    uk: "Дозволені репліки (для анонсу)",
  },
  adm_loc_pyro: { pl: "Pirotechnika", en: "Pyrotechnics", uk: "Піротехніка" },
  adm_pyro_yes: { pl: "Dozwolona", en: "Allowed", uk: "Дозволена" },
  adm_pyro_no: { pl: "Zakazana", en: "Forbidden", uk: "Заборонена" },
  adm_pyro_limited: { pl: "Z ograniczeniem", en: "Limited", uk: "З обмеженням" },
  adm_loc_pyro_note: {
    pl: "Doprecyzowanie (przy „z ograniczeniem”)",
    en: "Note (for “limited”)",
    uk: "Уточнення (для «з обмеженням»)",
  },
  adm_loc_pyro_note_pl: { pl: "Tekst PL", en: "PL text", uk: "Текст PL" },
  adm_loc_pyro_note_uk: { pl: "Tekst UA", en: "UA text", uk: "Текст UA" },
  adm_loc_firemode: { pl: "Tryb ognia", en: "Fire mode", uk: "Режим вогню" },
  adm_fire_auto: { pl: "Full-auto + semi", en: "Full-auto + semi", uk: "Full-auto + semi" },
  adm_fire_semi: { pl: "Tylko semi", en: "Semi only", uk: "Лише semi" },
  adm_loc_payment: {
    pl: "Płatność (do anonsu, przed disclaimerem)",
    en: "Payment (for the announcement, before the disclaimer)",
    uk: "Оплата (для анонсу, перед disclaimer)",
  },
  adm_loc_payment_pl: { pl: "Tekst PL", en: "PL text", uk: "Текст PL" },
  adm_loc_payment_uk: { pl: "Tekst UA", en: "UA text", uk: "Текст UA" },

  // ── Чек-лист підготовки до гри (Етап 13, майстер) ──
  adm_chores_title: { pl: "Czek-lista przygotowań", en: "Prep checklist", uk: "Чек-лист підготовки" },
  adm_chores_hint: {
    pl: "Pozycje wysyłane do grupy adminów przy anonsie gry. Każdy bierze pozycję na siebie; raport w piątek o 22:00.",
    en: "Items posted to the admin group when a game is announced. Each member claims items; report on Friday at 22:00.",
    uk: "Пункти йдуть у адмін-групу при анонсі гри. Кожен бере пункт на себе; звіт у п'ятницю о 22:00.",
  },
  adm_chore_add: { pl: "Nowa pozycja", en: "New item", uk: "Новий пункт" },
  adm_chore_kind: { pl: "Typ", en: "Type", uk: "Тип" },
  adm_chore_kind_action: { pl: "Działanie", en: "Action", uk: "Дія" },
  adm_chore_kind_gear: { pl: "Zabrać na grę", en: "Bring to game", uk: "Взяти на гру" },
  adm_chore_label: { pl: "Treść", en: "Label", uk: "Текст" },
  adm_chore_note: {
    pl: "Opis (opcjonalnie, np. lista zakupów)",
    en: "Note (optional, e.g. shopping list)",
    uk: "Опис (необов'язково, напр. список покупок)",
  },
  adm_chore_sort: { pl: "Kolejność", en: "Order", uk: "Порядок" },
  adm_chore_active: { pl: "Aktywna", en: "Active", uk: "Активний" },
  adm_chore_hidden: { pl: "Nieaktywna", en: "Inactive", uk: "Неактивний" },
  adm_chore_empty: { pl: "Brak pozycji.", en: "No items.", uk: "Немає пунктів." },

  // ── 6.4 Магазин за бали (майстер) ──
  adm_nav_shop: { pl: "Sklep", en: "Shop", uk: "Магазин" },
  adm_shop_title: { pl: "Sklep za punkty", en: "Points shop", uk: "Магазин за бали" },
  adm_shop_add: { pl: "Nowy towar", en: "New item", uk: "Новий товар" },
  adm_shop_empty: { pl: "Brak towarów.", en: "No items yet.", uk: "Немає товарів." },
  adm_shop_hidden: { pl: "ukryty", en: "hidden", uk: "прихований" },
  adm_shop_title_pl: { pl: "Nazwa (PL)", en: "Title (PL)", uk: "Назва (PL)" },
  adm_shop_title_en: { pl: "Nazwa (EN)", en: "Title (EN)", uk: "Назва (EN)" },
  adm_shop_title_uk: { pl: "Nazwa (UA)", en: "Title (UA)", uk: "Назва (UA)" },
  adm_shop_desc_pl: { pl: "Opis (PL)", en: "Description (PL)", uk: "Опис (PL)" },
  adm_shop_desc_en: { pl: "Opis (EN)", en: "Description (EN)", uk: "Опис (EN)" },
  adm_shop_desc_uk: { pl: "Opis (UA)", en: "Description (UA)", uk: "Опис (UA)" },
  adm_shop_cost: { pl: "Cena (punkty)", en: "Cost (points)", uk: "Ціна (бали)" },
  adm_shop_sort: { pl: "Kolejność", en: "Order", uk: "Порядок" },
  adm_shop_active: { pl: "Aktywny", en: "Active", uk: "Активний" },
  // Журнал покупок
  adm_shop_orders_title: { pl: "Zakupy", en: "Purchases", uk: "Покупки" },
  adm_shop_orders_empty: { pl: "Brak zakupów.", en: "No purchases.", uk: "Немає покупок." },
  adm_shop_col_player: { pl: "Gracz", en: "Player", uk: "Гравець" },
  adm_shop_col_item: { pl: "Towar", en: "Item", uk: "Товар" },
  adm_shop_col_cost: { pl: "Cena", en: "Cost", uk: "Ціна" },
  adm_shop_col_date: { pl: "Data", en: "Date", uk: "Дата" },
  adm_shop_col_status: { pl: "Status", en: "Status", uk: "Статус" },
  adm_shop_status_pending: { pl: "Oczekuje", en: "Pending", uk: "Очікує" },
  adm_shop_status_done: { pl: "Wydano", en: "Handed over", uk: "Видано" },
  adm_shop_mark_done: { pl: "Wydano", en: "Hand over", uk: "Видати" },

  // Ачівки (адмінка)
  adm_nav_achievements: { pl: "Osiągnięcia", en: "Achievements", uk: "Ачівки" },
  adm_ach_add: { pl: "Nowe osiągnięcie", en: "New achievement", uk: "Нова ачівка" },
  adm_ach_empty: { pl: "Brak osiągnięć.", en: "No achievements yet.", uk: "Немає ачівок." },
  adm_ach_disabled: { pl: "wyłączone", en: "disabled", uk: "вимкнено" },
  adm_ach_code: { pl: "Kod (unikalny)", en: "Code (unique)", uk: "Код (унікальний)" },
  adm_ach_tier: { pl: "Poziom", en: "Tier", uk: "Рівень" },
  adm_ach_tier_easy: { pl: "łatwe", en: "easy", uk: "легка" },
  adm_ach_tier_mid: { pl: "średnie", en: "mid", uk: "середня" },
  adm_ach_tier_hard: { pl: "trudne", en: "hard", uk: "складна" },
  adm_ach_enabled: { pl: "Włączone", en: "Enabled", uk: "Увімкнено" },
  adm_ach_earned_hint: {
    pl: "Zdobyte przez graczy — wyłącz zamiast usuwać.",
    en: "Earned by players — disable instead of deleting.",
    uk: "Здобуто гравцями — вимкни замість видалення.",
  },
  adm_ach_log_title: { pl: "Zdobyte osiągnięcia", en: "Earned achievements", uk: "Здобуті ачівки" },
  adm_ach_log_empty: { pl: "Nikt jeszcze nic nie zdobył.", en: "Nothing earned yet.", uk: "Ще нічого не здобуто." },
  adm_ach_col_player: { pl: "Gracz", en: "Player", uk: "Гравець" },
  adm_ach_col_ach: { pl: "Osiągnięcie", en: "Achievement", uk: "Ачівка" },
  adm_ach_col_code: { pl: "Kod", en: "Code", uk: "Код" },
  adm_ach_col_date: { pl: "Data", en: "Date", uk: "Дата" },
  adm_ach_err_dup: { pl: "Taki kod już istnieje.", en: "That code already exists.", uk: "Такий код уже існує." },
  adm_ach_err_inuse: {
    pl: "Osiągnięcie jest już zdobyte — wyłącz je zamiast usuwać.",
    en: "Achievement already earned — disable it instead of deleting.",
    uk: "Ачівку вже здобуто — вимкни її замість видалення.",
  },
  // SVG-мініатюра ачівки (Етап 20)
  adm_ach_thumb: { pl: "Miniatura (SVG)", en: "Thumbnail (SVG)", uk: "Мініатюра (SVG)" },
  adm_ach_thumb_hint: { pl: "SVG, do 50 KB.", en: "SVG, up to 50 KB.", uk: "SVG, до 50 КБ." },
  adm_ach_thumb_saving: { pl: "Wysyłanie…", en: "Uploading…", uk: "Завантаження…" },
  adm_ach_thumb_too_big: {
    pl: "Plik za duży (maks. 50 KB).",
    en: "File too large (max 50 KB).",
    uk: "Файл завеликий (макс. 50 КБ).",
  },
  adm_ach_thumb_bad_type: { pl: "Tylko plik SVG.", en: "SVG file only.", uk: "Лише файл SVG." },
  adm_ach_thumb_err: { pl: "Nie udało się wysłać.", en: "Upload failed.", uk: "Не вдалося завантажити." },
  adm_ach_thumb_create_hint: {
    pl: "Zapisz osiągnięcie, potem dodaj miniaturę.",
    en: "Save the achievement, then add a thumbnail.",
    uk: "Збережіть ачівку, потім додайте мініатюру.",
  },
  // Опис + вид ачівки (Етап 21)
  adm_ach_desc_pl: { pl: "Opis (PL)", en: "Description (PL)", uk: "Опис (PL)" },
  adm_ach_desc_en: { pl: "Opis (EN)", en: "Description (EN)", uk: "Опис (EN)" },
  adm_ach_desc_uk: { pl: "Opis (UA)", en: "Description (UA)", uk: "Опис (UA)" },
  adm_ach_kind: { pl: "Rodzaj", en: "Kind", uk: "Вид" },
  adm_ach_kind_auto: { pl: "Automatyczna", en: "Auto", uk: "Авто" },
  adm_ach_kind_manual: { pl: "Ręczna", en: "Manual", uk: "Ручна" },
  adm_ach_kind_auto_hint: {
    pl: "Złożona logika wyzwalania — przyznawana automatycznie (opis = warunek).",
    en: "Complex trigger logic — granted automatically (description = condition).",
    uk: "Складна логіка спрацювання — видається автоматично (опис = умова).",
  },
  adm_ach_kind_manual_hint: {
    pl: "Prosta — przyznaje administrator ręcznie w panelu (menu Gracze).",
    en: "Simple — granted by an admin manually in the panel (Players menu).",
    uk: "Проста — видає адмін вручну в адмінці (меню Гравці).",
  },
  // Видача ачівки гравцю (меню Гравці, Етап 21)
  adm_grant_ach_select_ph: {
    pl: "Przyznaj osiągnięcie…",
    en: "Grant achievement…",
    uk: "Видати ачівку…",
  },
  adm_btn_grant: { pl: "Przyznaj", en: "Grant", uk: "Видати" },
  adm_grant_ach_exists: {
    pl: "Gracz ma już to osiągnięcie (lub jest ono wyłączone).",
    en: "Player already has this achievement (or it is disabled).",
    uk: "У гравця вже є ця ачівка (або вона вимкнена).",
  },

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
  adm_close: { pl: "Zamknij", en: "Close", uk: "Закрити" },
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
  adm_players_search_ph: {
    pl: "Szukaj gracza — pseudonim, imię, @telegram…",
    en: "Search player — callsign, name, @telegram…",
    uk: "Пошук гравця — позивний, ім'я, @telegram…",
  },
  adm_players_search_empty: {
    pl: "Nic nie znaleziono.",
    en: "Nothing found.",
    uk: "Нічого не знайдено.",
  },

  adm_referrals_title: { pl: "Polecenia", en: "Referrals", uk: "Реферали" },
  adm_inviter: { pl: "Zapraszający", en: "Inviter", uk: "Запросив" },
  adm_invited: { pl: "Nowy", en: "Newcomer", uk: "Новачок" },
  adm_btn_confirm: { pl: "Potwierdź", en: "Confirm", uk: "Підтвердити" },
  adm_btn_reject: { pl: "Odrzuć", en: "Reject", uk: "Відхилити" },
  adm_empty: { pl: "Brak danych.", en: "No data.", uk: "Немає даних." },

  adm_rental_title: { pl: "Zgłoszenia wynajmu", en: "Rental requests", uk: "Заявки на оренду" },

  adm_joins_title: { pl: "Wnioski do grupy (shield)", en: "Group join requests", uk: "Заявки в групу" },
  adm_joins_note: {
    pl: "Decyzje podejmuje bot automatycznie (captcha). Tu podgląd ostatnich.",
    en: "Decisions are automatic (captcha). Recent attempts shown here.",
    uk: "Рішення приймає бот автоматично (капча). Тут перегляд останніх.",
  },

  adm_roles_title: { pl: "Role adminów", en: "Admin roles", uk: "Ролі адмінів" },
  adm_master: { pl: "Master", en: "Master", uk: "Майстер" },
  adm_btn_save_roles: { pl: "Zapisz role", en: "Save roles", uk: "Зберегти ролі" },
  adm_role_admin: { pl: "Admin", en: "Admin", uk: "Адмін" },
  adm_role_player: { pl: "Gracz", en: "Player", uk: "Гравець" },
  adm_make_admin: { pl: "Zrób adminem", en: "Make admin", uk: "Зробити адміном" },

  // Легенда дозволів (показується внизу «Ролі адмінів», лише майстру).
  adm_perms_legend_title: {
    pl: "Co oznaczają uprawnienia",
    en: "What the permissions mean",
    uk: "Що означають дозволи",
  },
  adm_perm_games: {
    pl: "tworzenie i odwoływanie gier, odhaczanie obecności (check-in).",
    en: "create and cancel games, mark attendance (check-in).",
    uk: "створення й скасування ігор, відмічання присутності (чек-ін).",
  },
  adm_perm_locations: {
    pl: "zarządzanie lokalizacjami gier.",
    en: "manage game locations.",
    uk: "керування локаціями ігор.",
  },
  adm_perm_rental: {
    pl: "podgląd zgłoszeń wynajmu sprzętu.",
    en: "view equipment rental requests.",
    uk: "перегляд заявок на оренду спорядження.",
  },
  adm_perm_referrals: {
    pl: "zatwierdzanie i odrzucanie poleceń.",
    en: "confirm and reject referrals.",
    uk: "підтвердження й відхилення рефералів.",
  },
  adm_perm_players: {
    pl: "korekta punktów/salda, patch, zmiana pseudonimu, przyznawanie osiągnięć.",
    en: "adjust points/balance, patch, change callsign, grant achievements.",
    uk: "корекція балів/балансу, патч, зміна позивного, видача ачівок.",
  },
  adm_perm_joins: {
    pl: "podgląd zgłoszeń dołączenia do grupy.",
    en: "view group join attempts.",
    uk: "перегляд заявок на приєднання до групи.",
  },
  adm_perm_gallery: {
    pl: "wgrywanie i usuwanie zdjęć w galerii.",
    en: "upload and remove gallery photos.",
    uk: "завантаження й видалення фото в галереї.",
  },
  adm_perm_shop: {
    pl: "zarządzanie sklepem za punkty, powiadomienia o zakupach.",
    en: "manage the points shop, purchase notifications.",
    uk: "керування магазином за бали, сповіщення про покупки.",
  },
  adm_perm_achievements: {
    pl: "tworzenie i edycja osiągnięć.",
    en: "create and edit achievements.",
    uk: "створення й редагування ачівок.",
  },
  adm_perm_chores: {
    pl: "checklista przygotowania do gry.",
    en: "game preparation checklist.",
    uk: "чек-лист підготовки до гри.",
  },
  adm_perm_export: {
    pl: "eksport danych do CSV (gracze, rejestracje, check-iny).",
    en: "export data to CSV (players, registrations, check-ins).",
    uk: "експорт даних у CSV (гравці, реєстрації, чек-іни).",
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

// Безпечна локалізація статусу для пігулок: fallback на сирий статус, якщо ключа немає (ADR-0025).
export function statusText(lang: Lang, prefix: string, status: string): string {
  const d = SITE[`${prefix}_${status}`];
  return (d && (d[lang] ?? d.en)) ?? status;
}

// Вибір мови сайту: cookie має пріоритет, далі Accept-Language, далі uk.
export function resolveLang(cookieVal?: string | null, acceptLang?: string | null): Lang {
  if (cookieVal && (SITE_LANGS as string[]).includes(cookieVal)) return cookieVal as Lang;
  const al = (acceptLang ?? "").toLowerCase();
  if (al.startsWith("pl") || al.includes(",pl") || al.includes(" pl")) return "pl";
  if (al.startsWith("en") || al.includes(",en") || al.includes(" en")) return "en";
  return "uk";
}
