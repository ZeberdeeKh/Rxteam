// Схема редактора налаштувань (6.4, майстер-онлі). Керується таблицею settings.
// Підписи (title груп + label полів) — тримовні (PL/EN/UA), щоб редактор слідував
// мові сайту (перемикач rx_lang), а не був жорстко польським. Резолвимо в page.tsx
// через f.label[lang] / g.title[lang]. Маркери мови контенту «(PL)/(EN)/(UA)» лишаються
// як є — вони позначають, якою мовою редагується сам текст бота, а не мову UI.
import { captchaPrompt, correctMap, wrongMap, expiredMap, faq, type Lang } from "./i18n";
import { REPLICA_TYPES, LIMIT_SETTING_DEFAULTS } from "./replicas";
import { tr } from "./strings";
import { st } from "./site-i18n";

type Loc = Record<Lang, string>;

// Дефолтні шаблони щоденного нагадування (UA+PL). Токени {locations} і {link}
// підставляє крон (app/api/cron/reminders/route.ts). Порожнє поле в адмінці → цей текст.
export const DAILY_REMINDER_DEFAULT = {
  uk: "Нагадуємо, що на цьому тижні граємо на {locations}. Не забудь зареєструватися, якщо плануєш їхати — щоб не втратити свої бали. {link}",
  pl: "Przypominamy, że w tym tygodniu gramy na {locations}. Nie zapomnij się zarejestrować, jeśli planujesz przyjechać — żeby nie stracić punktów. {link}",
};

// Системний блок про карпул, який крон дописує до щоденного нагадування (для записаних на
// гру). Не редагується в адмінці — згадує команди бота. Показується лише коли карпул увімкнено.
export const DAILY_REMINDER_CARPOOL = {
  uk: "\n\n🚗 Карпул (для записаних на гру):\n• їдеш своїм авто — зареєструйся як водій (у боті обери «своя машина»), щоб підвезти своїх;\n• потрібне місце — перевір водіїв командою /drivers у боті.",
  pl: "\n\n🚗 Carpool (dla zapisanych na grę):\n• jedziesz swoim autem — zarejestruj się jako kierowca (w bocie wybierz „własne auto”), aby kogoś podwieźć;\n• szukasz miejsca — sprawdź kierowców komendą /drivers w bocie.",
};

export type SettingField = {
  key: string;
  type: "toggle" | "number" | "text" | "textarea";
  label: Loc;
};
export type SettingGroup = { title: Loc; fields: SettingField[] };

// Підказка-формат у полях лімітів реплік (показується сірим, поки поле порожнє).
// Це приклад КОНТЕНТУ потрібною мовою (PL у _pl-полі, UA у _uk-полі) — лишаємо як є.
const replicaLimitPlaceholders: Record<string, string> = Object.fromEntries(
  REPLICA_TYPES.flatMap((t) => [
    [`limit_${t.code}_pl`, "np. 1.4 J · brak min. dystansu"],
    [`limit_${t.code}_uk`, "напр. 1.4 Дж · без мін. дистанції"],
  ]),
);

// Стандартні (fallback) значення для текстів бота — показуємо як placeholder,
// щоб майстер бачив, що бот шле зараз (порожнє поле = використовується це значення).
export const SETTING_DEFAULTS: Record<string, string> = {
  captcha_pl: captchaPrompt.pl,
  captcha_en: captchaPrompt.en,
  captcha_uk: captchaPrompt.uk,
  cap_ok_pl: correctMap.pl,
  cap_ok_en: correctMap.en,
  cap_ok_uk: correctMap.uk,
  cap_wrong_pl: wrongMap.pl,
  cap_wrong_en: wrongMap.en,
  cap_wrong_uk: wrongMap.uk,
  cap_expired_pl: expiredMap.pl,
  cap_expired_en: expiredMap.en,
  cap_expired_uk: expiredMap.uk,
  faq_pl: faq.pl,
  faq_en: faq.en,
  faq_uk: faq.uk,
  ...LIMIT_SETTING_DEFAULTS,
  ...replicaLimitPlaceholders,
  // Текст-пояснення патча (редагується на /admin/patches). Порожнє поле = вживається цей дефолт.
  patch_msg_pl: tr("pl", "patch_benefits"),
  patch_msg_en: tr("en", "patch_benefits"),
  patch_msg_uk: tr("uk", "patch_benefits"),
  // Щоденне нагадування — показуємо дефолтний текст як placeholder (порожнє поле = цей текст).
  daily_reminder_text_uk: DAILY_REMINDER_DEFAULT.uk,
  daily_reminder_text_pl: DAILY_REMINDER_DEFAULT.pl,
  // Лендінг, блок «Про нас» — дефолт = тексти site-i18n (порожнє поле = цей текст).
  home_about_pl: st("pl", "home_about_body"),
  home_about_en: st("en", "home_about_body"),
  home_about_uk: st("uk", "home_about_body"),
  // Бали за фото та зміна позивного — дефолти збігаються з кодовими fallback'ами.
  pts_photo_post: "1",
  photo_weekly_cap: "5",
  callsign_change_cost: "50",
  game_entry_cost: "100",
};

// Слово «ліміт» для згенерованих підписів полів лімітів реплік.
const LIMIT_WORD: Loc = { pl: "limit", en: "limit", uk: "ліміт" };

// Поля лімітів за типами реплік (пара PL+UA на кожен тип, у порядку REPLICA_TYPES).
// Назва репліки береться мовою UI (REPLICA_TYPES має pl/en/uk), маркер «(PL)/(UA)»
// позначає мову контенту і лишається сталим.
const replicaLimitFields: SettingField[] = REPLICA_TYPES.flatMap((t): SettingField[] => [
  {
    key: `limit_${t.code}_pl`,
    type: "textarea",
    label: {
      pl: `${t.pl} — ${LIMIT_WORD.pl} (PL)`,
      en: `${t.en} — ${LIMIT_WORD.en} (PL)`,
      uk: `${t.uk} — ${LIMIT_WORD.uk} (PL)`,
    },
  },
  {
    key: `limit_${t.code}_uk`,
    type: "textarea",
    label: {
      pl: `${t.pl} — ${LIMIT_WORD.pl} (UA)`,
      en: `${t.en} — ${LIMIT_WORD.en} (UA)`,
      uk: `${t.uk} — ${LIMIT_WORD.uk} (UA)`,
    },
  },
]);

export const SETTINGS_GROUPS: SettingGroup[] = [
  {
    title: { pl: "Funkcje (on/off)", en: "Features (on/off)", uk: "Функції (вкл/викл)" },
    fields: [
      { key: "feature_shield", type: "toggle", label: { pl: "Tarcza anty-bot", en: "Anti-bot shield", uk: "Захист від ботів" } },
      { key: "feature_onboarding_faq", type: "toggle", label: { pl: "FAQ powitalne", en: "Onboarding FAQ", uk: "Привітальний FAQ" } },
      { key: "feature_economy", type: "toggle", label: { pl: "Ekonomia (punkty)", en: "Economy (points)", uk: "Економіка (бали)" } },
      { key: "feature_achievements", type: "toggle", label: { pl: "Osiągnięcia", en: "Achievements", uk: "Ачівки" } },
      { key: "feature_referrals", type: "toggle", label: { pl: "Polecenia", en: "Referrals", uk: "Реферали" } },
      { key: "feature_reminders", type: "toggle", label: { pl: "Przypomnienia", en: "Reminders", uk: "Нагадування" } },
      { key: "feature_voting", type: "toggle", label: { pl: "Głosowanie lokalizacji", en: "Location voting", uk: "Голосування за локацію" } },
      { key: "feature_lottery", type: "toggle", label: { pl: "Loteria niezawodnych", en: "Reliable players' lottery", uk: "Лотерея надійних" } },
      { key: "feature_shop", type: "toggle", label: { pl: "Sklep za punkty", en: "Points shop", uk: "Магазин за бали" } },
      { key: "feature_site_link", type: "toggle", label: { pl: "Łączenie konta z TG", en: "Link account with TG", uk: "Прив'язка акаунта до TG" } },
      { key: "feature_chores", type: "toggle", label: { pl: "Czek-lista przygotowań", en: "Prep checklist", uk: "Чек-лист підготовки" } },
      { key: "feature_announce_count", type: "toggle", label: { pl: "Licznik graczy w anonsie", en: "Player counter in announcement", uk: "Лічильник гравців в анонсі" } },
      { key: "feature_media_guard", type: "toggle", label: { pl: "Strażnik tematu „tylko media”", en: "Media-only topic guard", uk: "Гард гілки «тільки медіа»" } },
      { key: "feature_daily_reminder", type: "toggle", label: { pl: "Codzienne przypomnienie o rejestracji", en: "Daily registration reminder", uk: "Щоденне нагадування про реєстрацію" } },
      { key: "feature_photo_award", type: "toggle", label: { pl: "Punkty za zdjęcia w temacie", en: "Points for photos in topic", uk: "Бали за фото в топіку" } },
      { key: "feature_player_card", type: "toggle", label: { pl: "Karta gracza (profil publiczny)", en: "Player card (public profile)", uk: "Картка гравця (публічний профіль)" } },
    ],
  },
  {
    // Лендінг, блок «Про нас» (перший модуль сторінки). Заголовок секції лишається в
    // site-i18n (як інші заголовки лендінгу) — тут редагується лише сам текст, по мовах.
    // Порожнє поле → fallback на дефолт із site-i18n (показаний як placeholder).
    title: { pl: "Strona — O nas", en: "Site — About us", uk: "Сайт — Про нас" },
    fields: [
      { key: "home_about_pl", type: "textarea", label: { pl: "Treść (PL)", en: "Text (PL)", uk: "Текст (PL)" } },
      { key: "home_about_en", type: "textarea", label: { pl: "Treść (EN)", en: "Text (EN)", uk: "Текст (EN)" } },
      { key: "home_about_uk", type: "textarea", label: { pl: "Treść (UA)", en: "Text (UA)", uk: "Текст (UA)" } },
    ],
  },
  {
    title: { pl: "Punkty", en: "Points", uk: "Бали" },
    fields: [
      { key: "pts_attend", type: "number", label: { pl: "Za obecność (+)", en: "For attendance (+)", uk: "За явку (+)" } },
      { key: "pts_noshow", type: "number", label: { pl: "Za nieobecność (−)", en: "For no-show (−)", uk: "За неявку (−)" } },
      { key: "pts_friend", type: "number", label: { pl: "Za poleconego znajomego (+)", en: "For a referred friend (+)", uk: "За приведеного друга (+)" } },
      // Бали за рівні ачивок (pts_ach_easy/mid/hard/legendary) редагуються в /admin/achievements
      // (панель «Бали за рівень», server-action saveAchievementPoints) — єдине джерело.
      { key: "pts_photo_post", type: "number", label: { pl: "Za zdjęcie w temacie (+)", en: "For a photo in topic (+)", uk: "За фото в топіку (+)" } },
      { key: "photo_weekly_cap", type: "number", label: { pl: "Limit punktów za zdjęcia / tydzień", en: "Photo points cap / week", uk: "Ліміт балів за фото / тиждень" } },
    ],
  },
  {
    // Ранги, зміна позивного і вхід на гру — це товари магазину; їхні ціни редагуються
    // на сторінці «Магазин» (/admin/shop → SHOP_SETTINGS_GROUPS), щоб усі товари були в
    // одному місці. Тут лишається тільки запас комплектів для оренди.
    title: { pl: "Wynajem", en: "Rental", uk: "Оренда" },
    fields: [
      { key: "rental_stock", type: "number", label: { pl: "Zapas zestawów do wynajęcia", en: "Rental sets in stock", uk: "Запас комплектів для оренди" } },
    ],
  },
  {
    title: { pl: "Przypomnienia", en: "Reminders", uk: "Нагадування" },
    fields: [
      { key: "remind_day_hour", type: "number", label: { pl: "Dzień przed — godzina (0–23)", en: "Day before — hour (0–23)", uk: "За день — година (0–23)" } },
      { key: "remind_before_h", type: "number", label: { pl: "W dniu gry — godz. przed startem", en: "On game day — hours before start", uk: "У день гри — годин до старту" } },
    ],
  },
  {
    // Щоденне групове нагадування про реєстрацію (постить у гілку «Флуд/Zalew»).
    // Гілка задається командою /setflood; on/off — у «Funkcje». {locations} = назви локацій
    // ігор цього тижня, {link} = посилання на сайт /games. Шле двомовно (UA+PL).
    title: { pl: "Codzienne przypomnienie", en: "Daily reminder", uk: "Щоденне нагадування" },
    fields: [
      { key: "daily_reminder_hour", type: "number", label: { pl: "Godzina wysłania (0–23)", en: "Send hour (0–23)", uk: "Година надсилання (0–23)" } },
      { key: "daily_reminder_text_uk", type: "textarea", label: { pl: "Treść (UA) — {locations}, {link}", en: "Text (UA) — {locations}, {link}", uk: "Текст (UA) — {locations}, {link}" } },
      { key: "daily_reminder_text_pl", type: "textarea", label: { pl: "Treść (PL) — {locations}, {link}", en: "Text (PL) — {locations}, {link}", uk: "Текст (PL) — {locations}, {link}" } },
    ],
  },
  {
    // Вікно чек-іну. Зміна перераховує checkin_from/checkin_to для всіх анонсованих
    // майбутніх ігор (app/admin/actions.ts → saveSettings).
    title: { pl: "Check-in (okno)", en: "Check-in (window)", uk: "Чек-ін (вікно)" },
    fields: [
      { key: "checkin_open_before_min", type: "number", label: { pl: "Otwarcie — minut przed zbiórką", en: "Opens — minutes before gather", uk: "Відкриття — хвилин до збору" } },
      { key: "checkin_close_after_min", type: "number", label: { pl: "Zamknięcie — minut po starcie", en: "Closes — minutes after start", uk: "Закриття — хвилин після старту" } },
    ],
  },
  {
    title: { pl: "Anons — bloki tekstu (PL)", en: "Announcement — text blocks (PL)", uk: "Анонс — текстові блоки (PL)" },
    fields: [
      { key: "ann_coffee_pl", type: "textarea", label: { pl: "Kawa/przekąski", en: "Coffee/snacks", uk: "Кава/перекус" } },
      { key: "ann_rental_pl", type: "textarea", label: { pl: "Wynajem", en: "Rental", uk: "Оренда" } },
      { key: "ann_transport_pl", type: "textarea", label: { pl: "Transport", en: "Transport", uk: "Транспорт" } },
      { key: "ann_disclaimer_pl", type: "textarea", label: { pl: "Disclaimer", en: "Disclaimer", uk: "Disclaimer" } },
    ],
  },
  {
    title: { pl: "Anons — bloki tekstu (UA)", en: "Announcement — text blocks (UA)", uk: "Анонс — текстові блоки (UA)" },
    fields: [
      { key: "ann_coffee_uk", type: "textarea", label: { pl: "Kawa/przekąski", en: "Coffee/snacks", uk: "Кава/перекус" } },
      { key: "ann_rental_uk", type: "textarea", label: { pl: "Wynajem", en: "Rental", uk: "Оренда" } },
      { key: "ann_transport_uk", type: "textarea", label: { pl: "Transport", en: "Transport", uk: "Транспорт" } },
      { key: "ann_disclaimer_uk", type: "textarea", label: { pl: "Disclaimer", en: "Disclaimer", uk: "Disclaimer" } },
    ],
  },
  {
    // Ліміти за типами реплік. Самі типи фіксовані в коді (lib/replicas.ts);
    // тут редагуються лише тексти лімітів. У локації обираєш, які типи допущені.
    title: { pl: "Limity replik (J/FPS)", en: "Replica limits (J/FPS)", uk: "Ліміти реплік (Дж/FPS)" },
    fields: replicaLimitFields,
  },
  {
    title: { pl: "Pyro i tryb ognia — komunikaty", en: "Pyro and fire mode — messages", uk: "Піро і режим вогню — повідомлення" },
    fields: [
      { key: "pyro_yes_pl", type: "textarea", label: { pl: "Pyro: dozwolone (PL)", en: "Pyro: allowed (PL)", uk: "Піро: дозволено (PL)" } },
      { key: "pyro_yes_uk", type: "textarea", label: { pl: "Pyro: dozwolone (UA)", en: "Pyro: allowed (UA)", uk: "Піро: дозволено (UA)" } },
      { key: "pyro_no_pl", type: "textarea", label: { pl: "Pyro: zakazane (PL)", en: "Pyro: forbidden (PL)", uk: "Піро: заборонено (PL)" } },
      { key: "pyro_no_uk", type: "textarea", label: { pl: "Pyro: zakazane (UA)", en: "Pyro: forbidden (UA)", uk: "Піро: заборонено (UA)" } },
      { key: "pyro_limited_pl", type: "textarea", label: { pl: "Pyro: z ograniczeniem (PL)", en: "Pyro: limited (PL)", uk: "Піро: з обмеженням (PL)" } },
      { key: "pyro_limited_uk", type: "textarea", label: { pl: "Pyro: z ograniczeniem (UA)", en: "Pyro: limited (UA)", uk: "Піро: з обмеженням (UA)" } },
      { key: "firemode_auto_pl", type: "textarea", label: { pl: "Full-auto (PL)", en: "Full-auto (PL)", uk: "Full-auto (PL)" } },
      { key: "firemode_auto_uk", type: "textarea", label: { pl: "Full-auto (UA)", en: "Full-auto (UA)", uk: "Full-auto (UA)" } },
      { key: "firemode_semi_pl", type: "textarea", label: { pl: "Tylko semi (PL)", en: "Semi only (PL)", uk: "Лише semi (PL)" } },
      { key: "firemode_semi_uk", type: "textarea", label: { pl: "Tylko semi (UA)", en: "Semi only (UA)", uk: "Лише semi (UA)" } },
    ],
  },
  {
    title: {
      pl: "Teksty bota — captcha / regulamin (PL/EN/UA)",
      en: "Bot texts — captcha / rules (PL/EN/UA)",
      uk: "Тексти бота — капча / правила (PL/EN/UA)",
    },
    fields: [
      { key: "captcha_pl", type: "textarea", label: { pl: "Captcha — powitanie (PL)", en: "Captcha — greeting (PL)", uk: "Капча — привітання (PL)" } },
      { key: "captcha_en", type: "textarea", label: { pl: "Captcha — powitanie (EN)", en: "Captcha — greeting (EN)", uk: "Капча — привітання (EN)" } },
      { key: "captcha_uk", type: "textarea", label: { pl: "Captcha — powitanie (UA)", en: "Captcha — greeting (UA)", uk: "Капча — привітання (UA)" } },
      { key: "cap_ok_pl", type: "textarea", label: { pl: "Captcha OK (PL)", en: "Captcha OK (PL)", uk: "Капча OK (PL)" } },
      { key: "cap_ok_en", type: "textarea", label: { pl: "Captcha OK (EN)", en: "Captcha OK (EN)", uk: "Капча OK (EN)" } },
      { key: "cap_ok_uk", type: "textarea", label: { pl: "Captcha OK (UA)", en: "Captcha OK (UA)", uk: "Капча OK (UA)" } },
      { key: "cap_wrong_pl", type: "textarea", label: { pl: "Captcha błąd (PL)", en: "Captcha error (PL)", uk: "Капча — помилка (PL)" } },
      { key: "cap_wrong_en", type: "textarea", label: { pl: "Captcha błąd (EN)", en: "Captcha error (EN)", uk: "Капча — помилка (EN)" } },
      { key: "cap_wrong_uk", type: "textarea", label: { pl: "Captcha błąd (UA)", en: "Captcha error (UA)", uk: "Капча — помилка (UA)" } },
      { key: "cap_expired_pl", type: "textarea", label: { pl: "Captcha czas minął (PL)", en: "Captcha expired (PL)", uk: "Капча — час вийшов (PL)" } },
      { key: "cap_expired_en", type: "textarea", label: { pl: "Captcha czas minął (EN)", en: "Captcha expired (EN)", uk: "Капча — час вийшов (EN)" } },
      { key: "cap_expired_uk", type: "textarea", label: { pl: "Captcha czas minął (UA)", en: "Captcha expired (UA)", uk: "Капча — час вийшов (UA)" } },
      { key: "faq_pl", type: "textarea", label: { pl: "Regulamin / FAQ (PL)", en: "Rules / FAQ (PL)", uk: "Правила / FAQ (PL)" } },
      { key: "faq_en", type: "textarea", label: { pl: "Regulamin / FAQ (EN)", en: "Rules / FAQ (EN)", uk: "Правила / FAQ (EN)" } },
      { key: "faq_uk", type: "textarea", label: { pl: "Regulamin / FAQ (UA)", en: "Rules / FAQ (UA)", uk: "Правила / FAQ (UA)" } },
    ],
  },
  {
    title: { pl: "Ogólne", en: "General", uk: "Загальне" },
    fields: [
      { key: "master_username", type: "text", label: { pl: "Master username (Telegram, bez @)", en: "Master username (Telegram, no @)", uk: "Master username (Telegram, без @)" } },
      { key: "announce_chat_id", type: "text", label: { pl: "Announce chat_id (grupa)", en: "Announce chat_id (group)", uk: "Announce chat_id (група)" } },
      { key: "announce_thread_id", type: "text", label: { pl: "Announce thread_id", en: "Announce thread_id", uk: "Announce thread_id" } },
      { key: "media_chat_id", type: "text", label: { pl: "Media chat_id (grupa)", en: "Media chat_id (group)", uk: "Media chat_id (група)" } },
      { key: "media_thread_id", type: "text", label: { pl: "Media thread_id", en: "Media thread_id", uk: "Media thread_id" } },
      { key: "flood_chat_id", type: "text", label: { pl: "Flood/Zalew chat_id (grupa)", en: "Flood/Zalew chat_id (group)", uk: "Flood/Zalew chat_id (група)" } },
      { key: "flood_thread_id", type: "text", label: { pl: "Flood/Zalew thread_id", en: "Flood/Zalew thread_id", uk: "Flood/Zalew thread_id" } },
      { key: "chores_chat_id", type: "text", label: { pl: "Czek-lista chat_id (grupa adminów)", en: "Checklist chat_id (admin group)", uk: "Чек-лист chat_id (група адмінів)" } },
      { key: "chores_thread_id", type: "text", label: { pl: "Czek-lista thread_id", en: "Checklist thread_id", uk: "Чек-лист thread_id" } },
      { key: "chores_admin_mentions", type: "text", label: { pl: "Czek-lista — pingowani admini (@user, spacja/przecinek)", en: "Checklist — pinged admins (@user, space/comma)", uk: "Чек-лист — пінговані адміни (@user, пробіл/кома)" } },
      { key: "photos_chat_id", type: "text", label: { pl: "Zdjęcia chat_id (grupa)", en: "Photos chat_id (group)", uk: "Фото chat_id (група)" } },
      { key: "photos_thread_id", type: "text", label: { pl: "Zdjęcia thread_id", en: "Photos thread_id", uk: "Фото thread_id" } },
    ],
  },
  {
    title: { pl: "Giełda (Barachołka)", en: "Marketplace", uk: "Барахолка" },
    fields: [
      { key: "feature_marketplace", type: "toggle", label: { pl: "Giełda — włącz", en: "Marketplace — on", uk: "Барахолка — увімкнено" } },
      { key: "marketplace_require_patch", type: "toggle", label: { pl: "Wymagaj naszywki do publikacji", en: "Require patch to publish", uk: "Потрібен патч для публікації" } },
      { key: "marketplace_expiry_enabled", type: "toggle", label: { pl: "Auto-wygasanie ogłoszeń", en: "Auto-expire listings", uk: "Авто-протермінування" } },
      { key: "marketplace_expiry_days", type: "number", label: { pl: "Wygaśnięcie po (dni)", en: "Expire after (days)", uk: "Протермінування через (днів)" } },
      { key: "marketplace_promo_tag", type: "text", label: { pl: "Tag publikacji na stronie", en: "Publish-on-site tag", uk: "Тег публікації на сайт" } },
      { key: "marketplace_patch_hint", type: "textarea", label: { pl: "Podpowiedź: jak zdobyć naszywkę", en: "Hint: how to get a patch", uk: "Підказка: як отримати патч" } },
      { key: "sales_chat_id", type: "text", label: { pl: "Giełda chat_id (grupa)", en: "Marketplace chat_id (group)", uk: "Барахолка chat_id (група)" } },
      { key: "sales_thread_id", type: "text", label: { pl: "Giełda thread_id", en: "Marketplace thread_id", uk: "Барахолка thread_id" } },
    ],
  },
];

// Усі toggle-ключі (для обробки чекбоксів при збереженні).
export const TOGGLE_KEYS = SETTINGS_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.type === "toggle").map((f) => f.key),
);
export const VALUE_KEYS = SETTINGS_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.type !== "toggle").map((f) => f.key),
);

// ── Налаштування системи патчів (окрема сторінка /admin/patches, право "patch") ──
// Винесено із загальних «Налаштувань» (майстер-онлі), щоб делегувати керування патчами
// адмінам без повного доступу. Текст-пояснення (patch_msg_*) редагується тут; порожнє
// поле → fallback на i18n (tr/st "patch_benefits"). Рендериться тим самим кодом, що й
// SETTINGS_GROUPS, але зберігається окремою дією savePatchSettings.
export const PATCH_SETTINGS_GROUPS: SettingGroup[] = [
  {
    title: { pl: "Naszywka — funkcja i ceny", en: "Patch — feature & pricing", uk: "Патч — функція і ціни" },
    fields: [
      { key: "feature_patch", type: "toggle", label: { pl: "Naszywka (członkostwo)", en: "Patch (membership)", uk: "Патч (членство)" } },
      { key: "patch_price_zl", type: "text", label: { pl: "Cena naszywki (zł, gotówka)", en: "Patch price (zł, cash)", uk: "Ціна патча (zł, готівка)" } },
      { key: "no_patch_multiplier", type: "number", label: { pl: "Mnożnik bez naszywki (0–1)", en: "Multiplier without patch (0–1)", uk: "Множник без патча (0–1)" } },
    ],
  },
  {
    title: { pl: "Tekst objaśnienia naszywki", en: "Patch explainer text", uk: "Текст-пояснення патча" },
    fields: [
      { key: "patch_msg_pl", type: "textarea", label: { pl: "Objaśnienie (PL)", en: "Explainer (PL)", uk: "Пояснення (PL)" } },
      { key: "patch_msg_en", type: "textarea", label: { pl: "Objaśnienie (EN)", en: "Explainer (EN)", uk: "Пояснення (EN)" } },
      { key: "patch_msg_uk", type: "textarea", label: { pl: "Objaśnienie (UA)", en: "Explainer (UA)", uk: "Пояснення (UA)" } },
    ],
  },
];

export const PATCH_TOGGLE_KEYS = PATCH_SETTINGS_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.type === "toggle").map((f) => f.key),
);
export const PATCH_VALUE_KEYS = PATCH_SETTINGS_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.type !== "toggle").map((f) => f.key),
);

// ── Ціни товарів магазину (сторінка /admin/shop, право "shop") ──
// Системні товари (вхід на гру, зміна позивного) і ранги мають фіксовану логіку в коді,
// тож редагується лише їхня ціна в балах. Винесено із загальних «Налаштувань» (як патч),
// щоб усі товари магазину керувались з однієї сторінки. Зберігається дією saveShopSettings.
export const SHOP_SETTINGS_GROUPS: SettingGroup[] = [
  {
    title: { pl: "Towary systemowe — ceny (pkt)", en: "System products — prices (pts)", uk: "Системні товари — ціни (бали)" },
    fields: [
      { key: "game_entry_cost", type: "number", label: { pl: "Darmowe wejście na grę (koszt, pkt)", en: "Free game entry (cost, pts)", uk: "Безкоштовний вхід на гру (ціна, бали)" } },
      { key: "callsign_change_cost", type: "number", label: { pl: "Zmiana pseudonimu (koszt, pkt)", en: "Callsign change (cost, pts)", uk: "Зміна позивного (ціна, бали)" } },
    ],
  },
  {
    title: { pl: "Rangi — ceny (pkt)", en: "Ranks — prices (pts)", uk: "Ранги — ціни (бали)" },
    fields: [
      { key: "rank_cost_scout", type: "number", label: { pl: "Koszt: Scout", en: "Cost: Scout", uk: "Ціна: Scout" } },
      { key: "rank_cost_squad", type: "number", label: { pl: "Koszt: Squad Leader", en: "Cost: Squad Leader", uk: "Ціна: Squad Leader" } },
      { key: "rank_cost_team", type: "number", label: { pl: "Koszt: Team Leader", en: "Cost: Team Leader", uk: "Ціна: Team Leader" } },
    ],
  },
];

export const SHOP_TOGGLE_KEYS = SHOP_SETTINGS_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.type === "toggle").map((f) => f.key),
);
export const SHOP_VALUE_KEYS = SHOP_SETTINGS_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.type !== "toggle").map((f) => f.key),
);
