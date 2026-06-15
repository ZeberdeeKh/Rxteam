// Ліміти потужності за типами реплік (для анонсів і налаштувань локацій).
//
// Типи реплік — ФІКСОВАНИЙ список у коді. Редагуються лише тексти лімітів
// (settings: limit_<code>_pl / limit_<code>_uk). У налаштуваннях локації майстер
// обирає, які типи допущені саме там — і в анонс цієї локації автоматично
// підставляються ліміти лише цих типів + рядки про піро та режим вогню.

export type ReplicaCode = "cqb" | "dmr" | "sniper" | "pistol" | "lmg";

// Порядок = порядок показу в налаштуваннях і в анонсі.
export const REPLICA_TYPES: { code: ReplicaCode; pl: string; en: string; uk: string }[] = [
  { code: "cqb", pl: "CQB", en: "CQB", uk: "CQB" },
  { code: "dmr", pl: "DMR", en: "DMR", uk: "DMR" },
  { code: "sniper", pl: "Snajper", en: "Sniper", uk: "Снайпер" },
  { code: "pistol", pl: "Pistolet", en: "Pistol", uk: "Пістолет" },
  { code: "lmg", pl: "Karabin maszynowy (LMG)", en: "Machine gun (LMG)", uk: "Кулемет (LMG)" },
];

export const REPLICA_CODES: ReplicaCode[] = REPLICA_TYPES.map((t) => t.code);

// Стани піротехніки та режиму вогню. Тексти — стандартні (нижче), у settings можна перекрити.
export const PYRO_STATES = ["yes", "no", "limited"] as const;
export type PyroState = (typeof PYRO_STATES)[number];

export const FIRE_MODES = ["auto", "semi"] as const;
export type FireMode = (typeof FIRE_MODES)[number];

// Стандартні (fallback) тексти повідомлень піро/режиму вогню. Порожнє поле в settings = цей текст.
// Ліміти самих реплік (limit_<code>_*) тут НЕ задаємо — їх вписує майстер у панелі.
export const LIMIT_SETTING_DEFAULTS: Record<string, string> = {
  pyro_yes_pl: "🧨 Pirotechnika: dozwolona.",
  pyro_yes_uk: "🧨 Піротехніка: дозволена.",
  pyro_no_pl: "🚫 Pirotechnika: zakazana.",
  pyro_no_uk: "🚫 Піротехніка: заборонена.",
  pyro_limited_pl: "⚠️ Pirotechnika: z ograniczeniami.",
  pyro_limited_uk: "⚠️ Піротехніка: з обмеженнями.",
  firemode_auto_pl: "🔁 Tryb ognia: full-auto dozwolony.",
  firemode_auto_uk: "🔁 Режим вогню: full-auto дозволений.",
  firemode_semi_pl: "1️⃣ Tryb ognia: tylko semi.",
  firemode_semi_uk: "1️⃣ Режим вогню: лише semi.",
};
