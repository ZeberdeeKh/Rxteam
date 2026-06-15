// Схема редактора налаштувань (6.4, майстер-онлі). Керується таблицею settings.
// Підписи — технічні (ключі + короткий опис); екран бачить лише майстер.
import { captchaPrompt, correctMap, wrongMap, expiredMap, faq } from "./i18n";
import { REPLICA_TYPES, LIMIT_SETTING_DEFAULTS } from "./replicas";

export type SettingField = {
  key: string;
  type: "toggle" | "number" | "text" | "textarea";
  label: string;
};
export type SettingGroup = { title: string; fields: SettingField[] };

// Підказка-формат у полях лімітів реплік (показується сірим, поки поле порожнє).
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
};

// Поля лімітів за типами реплік (пара PL+UA на кожен тип, у порядку REPLICA_TYPES).
const replicaLimitFields: SettingField[] = REPLICA_TYPES.flatMap((t): SettingField[] => [
  { key: `limit_${t.code}_pl`, type: "textarea", label: `${t.pl} — limit (PL)` },
  { key: `limit_${t.code}_uk`, type: "textarea", label: `${t.uk} — ліміт (UA)` },
]);

export const SETTINGS_GROUPS: SettingGroup[] = [
  {
    title: "Funkcje (on/off)",
    fields: [
      { key: "feature_shield", type: "toggle", label: "Anti-bot shield" },
      { key: "feature_onboarding_faq", type: "toggle", label: "Onboarding FAQ" },
      { key: "feature_economy", type: "toggle", label: "Ekonomia (punkty)" },
      { key: "feature_patch", type: "toggle", label: "Patch (członkostwo)" },
      { key: "feature_achievements", type: "toggle", label: "Osiągnięcia" },
      { key: "feature_referrals", type: "toggle", label: "Polecenia" },
      { key: "feature_reminders", type: "toggle", label: "Przypomnienia" },
      { key: "feature_voting", type: "toggle", label: "Głosowanie lokalizacji" },
      { key: "feature_lottery", type: "toggle", label: "Loteria niezawodnych" },
      { key: "feature_shop", type: "toggle", label: "Sklep za punkty" },
      { key: "feature_site_link", type: "toggle", label: "Łączenie konta z TG" },
    ],
  },
  {
    title: "Punkty",
    fields: [
      { key: "pts_attend", type: "number", label: "Za obecność (+)" },
      { key: "pts_noshow", type: "number", label: "Za nieobecność (−)" },
      { key: "pts_friend", type: "number", label: "Za poleconego znajomego (+)" },
      { key: "pts_ach_easy", type: "number", label: "Osiągnięcie: easy" },
      { key: "pts_ach_mid", type: "number", label: "Osiągnięcie: mid" },
      { key: "pts_ach_hard", type: "number", label: "Osiągnięcie: hard" },
      { key: "no_patch_multiplier", type: "number", label: "Mnożnik bez patcha (0–1)" },
    ],
  },
  {
    title: "Stopnie i patch",
    fields: [
      { key: "rank_cost_scout", type: "number", label: "Koszt: Scout" },
      { key: "rank_cost_squad", type: "number", label: "Koszt: Squad Leader" },
      { key: "rank_cost_team", type: "number", label: "Koszt: Team Leader" },
      { key: "patch_price_zl", type: "text", label: "Cena patcha (zł, gotówka)" },
      { key: "rental_stock", type: "number", label: "Zapas zestawów do wynajęcia" },
    ],
  },
  {
    title: "Przypomnienia",
    fields: [
      { key: "remind_day_hour", type: "number", label: "Dzień przed — godzina (0–23)" },
      { key: "remind_before_h", type: "number", label: "W dniu gry — godz. przed startem" },
    ],
  },
  {
    title: "Anons — bloki tekstu (PL)",
    fields: [
      { key: "ann_coffee_pl", type: "textarea", label: "Kawa/przekąski" },
      { key: "ann_rental_pl", type: "textarea", label: "Wynajem" },
      { key: "ann_transport_pl", type: "textarea", label: "Transport" },
      { key: "ann_disclaimer_pl", type: "textarea", label: "Disclaimer" },
    ],
  },
  {
    title: "Anons — bloki tekstu (UA)",
    fields: [
      { key: "ann_coffee_uk", type: "textarea", label: "Кава/перекус" },
      { key: "ann_rental_uk", type: "textarea", label: "Оренда" },
      { key: "ann_transport_uk", type: "textarea", label: "Транспорт" },
      { key: "ann_disclaimer_uk", type: "textarea", label: "Disclaimer" },
    ],
  },
  {
    // Ліміти за типами реплік. Самі типи фіксовані в коді (lib/replicas.ts);
    // тут редагуються лише тексти лімітів. У локації обираєш, які типи допущені.
    title: "Limity replik (Дж/FPS)",
    fields: replicaLimitFields,
  },
  {
    title: "Pyro i tryb ognia — komunikaty",
    fields: [
      { key: "pyro_yes_pl", type: "textarea", label: "Pyro: dozwolone (PL)" },
      { key: "pyro_yes_uk", type: "textarea", label: "Піро: дозволено (UA)" },
      { key: "pyro_no_pl", type: "textarea", label: "Pyro: zakazane (PL)" },
      { key: "pyro_no_uk", type: "textarea", label: "Піро: заборонено (UA)" },
      { key: "pyro_limited_pl", type: "textarea", label: "Pyro: z ograniczeniem (PL)" },
      { key: "pyro_limited_uk", type: "textarea", label: "Піро: з обмеженням (UA)" },
      { key: "firemode_auto_pl", type: "textarea", label: "Full-auto (PL)" },
      { key: "firemode_auto_uk", type: "textarea", label: "Full-auto (UA)" },
      { key: "firemode_semi_pl", type: "textarea", label: "Tylko semi (PL)" },
      { key: "firemode_semi_uk", type: "textarea", label: "Лише semi (UA)" },
    ],
  },
  {
    title: "Teksty bota — captcha / regulamin (PL/EN/UA)",
    fields: [
      { key: "captcha_pl", type: "textarea", label: "Captcha — powitanie (PL)" },
      { key: "captcha_en", type: "textarea", label: "Captcha — powitanie (EN)" },
      { key: "captcha_uk", type: "textarea", label: "Captcha — powitanie (UA)" },
      { key: "cap_ok_pl", type: "textarea", label: "Captcha OK (PL)" },
      { key: "cap_ok_en", type: "textarea", label: "Captcha OK (EN)" },
      { key: "cap_ok_uk", type: "textarea", label: "Captcha OK (UA)" },
      { key: "cap_wrong_pl", type: "textarea", label: "Captcha błąd (PL)" },
      { key: "cap_wrong_en", type: "textarea", label: "Captcha błąd (EN)" },
      { key: "cap_wrong_uk", type: "textarea", label: "Captcha błąd (UA)" },
      { key: "cap_expired_pl", type: "textarea", label: "Captcha czas minął (PL)" },
      { key: "cap_expired_en", type: "textarea", label: "Captcha czas minął (EN)" },
      { key: "cap_expired_uk", type: "textarea", label: "Captcha czas minął (UA)" },
      { key: "faq_pl", type: "textarea", label: "Regulamin / FAQ (PL)" },
      { key: "faq_en", type: "textarea", label: "Regulamin / FAQ (EN)" },
      { key: "faq_uk", type: "textarea", label: "Regulamin / FAQ (UA)" },
    ],
  },
  {
    title: "Ogólne",
    fields: [
      { key: "master_username", type: "text", label: "Master username (Telegram, bez @)" },
      { key: "announce_chat_id", type: "text", label: "Announce chat_id (grupa)" },
      { key: "announce_thread_id", type: "text", label: "Announce thread_id" },
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
