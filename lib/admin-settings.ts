// Схема редактора налаштувань (6.4, майстер-онлі). Керується таблицею settings.
// Підписи — технічні (ключі + короткий опис); екран бачить лише майстер.
export type SettingField = {
  key: string;
  type: "toggle" | "number" | "text" | "textarea";
  label: string;
};
export type SettingGroup = { title: string; fields: SettingField[] };

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
      { key: "ann_limits_pl", type: "textarea", label: "Limity FPS/J" },
      { key: "ann_disclaimer_pl", type: "textarea", label: "Disclaimer" },
    ],
  },
  {
    title: "Anons — bloki tekstu (UA)",
    fields: [
      { key: "ann_coffee_uk", type: "textarea", label: "Кава/перекус" },
      { key: "ann_rental_uk", type: "textarea", label: "Оренда" },
      { key: "ann_transport_uk", type: "textarea", label: "Транспорт" },
      { key: "ann_limits_uk", type: "textarea", label: "Ліміти FPS/J" },
      { key: "ann_disclaimer_uk", type: "textarea", label: "Disclaimer" },
    ],
  },
  {
    title: "Ogólne",
    fields: [
      { key: "master_username", type: "text", label: "Master username (Telegram, bez @)" },
      { key: "announce_chat_id", type: "text", label: "Announce chat_id" },
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
