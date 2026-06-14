export type Lang = "pl" | "en" | "uk";

// Вибір мови за language_code користувача Telegram. RU не підтримуємо → ru мапимо на uk.
export function pickLang(code?: string): Lang {
  if (!code) return "en";
  const c = code.toLowerCase();
  if (c.startsWith("pl")) return "pl";
  if (c.startsWith("uk") || c.startsWith("ru")) return "uk";
  return "en";
}

export const t = {
  captcha: {
    pl: (a: number, b: number) =>
      `Witaj w RX Team! 🪖\nAby potwierdzić, że nie jesteś botem, rozwiąż: ${a} + ${b} = ?`,
    en: (a: number, b: number) =>
      `Welcome to RX Team! 🪖\nTo confirm you're not a bot, solve: ${a} + ${b} = ?`,
    uk: (a: number, b: number) =>
      `Вітаємо в RX Team! 🪖\nЩоб підтвердити, що ти не бот, розв'яжи: ${a} + ${b} = ?`,
  } as Record<Lang, (a: number, b: number) => string>,

  correct: {
    pl: "✅ Dziękujemy! Twoja prośba o dołączenie została zatwierdzona.",
    en: "✅ Thanks! Your join request has been approved.",
    uk: "✅ Дякуємо! Твою заявку на вступ підтверджено.",
  } as Record<Lang, string>,

  wrong: {
    pl: "❌ Niepoprawna odpowiedź. Możesz ponownie wysłać prośbę o dołączenie.",
    en: "❌ Wrong answer. You can request to join again.",
    uk: "❌ Невірна відповідь. Можеш подати заявку на вступ ще раз.",
  } as Record<Lang, string>,

  expired: {
    pl: "⏳ Czas minął. Wyślij prośbę o dołączenie ponownie.",
    en: "⏳ Time's up. Please request to join again.",
    uk: "⏳ Час вийшов. Подай заявку на вступ ще раз.",
  } as Record<Lang, string>,
};

// ЧЕРНЕТКА онбордингу — доопрацюємо з організатором (ліміти FPS/джоулів заповнить адмін).
export const faq: Record<Lang, string> = {
  pl: `🎯 RX Team — info dla nowych

🔫 Limity mocy (J/FPS): [do uzupełnienia przez organizatora]
🥽 Ochrona oczu OBOWIĄZKOWA przez całą grę.
🚩 "Trafiony" — podnosisz rękę / czerwoną szmatkę i idziesz do respawnu.
🤝 Fair play — zaliczaj trafienia.

🎒 Co zabrać: replika + akumulator/gaz, kulki, ochrona oczu/twarzy, ubranie na pogodę, woda.
🆕 Nie masz sprzętu? Jest wypożyczalnia — zaznacz przy rejestracji w bocie.

ℹ️ Rejestracja na grę i check-in — przez menu bota. Pytania — pisz do organizatorów. Miłej gry!`,

  en: `🎯 RX Team — info for newcomers

🔫 Power limits (J/FPS): [to be filled in by organizer]
🥽 Eye protection is MANDATORY for the whole game.
🚩 "Hit" — raise your hand / red rag and walk to respawn.
🤝 Fair play — call your hits.

🎒 What to bring: replica + battery/gas, BBs, eye/face protection, weather-appropriate clothes, water.
🆕 No gear? Rental is available — mark it during registration in the bot.

ℹ️ Game registration & check-in — via the bot menu. Questions — message the organizers. Have a good game!`,

  uk: `🎯 RX Team — інфо для новачків

🔫 Ліміти потужності (Дж/FPS): [заповнить організатор]
🥽 Захист очей ОБОВ'ЯЗКОВИЙ протягом усієї гри.
🚩 "Поранений" — піднімаєш руку / червону ганчірку і йдеш у респ.
🤝 Чесна гра — зараховуй влучання.

🎒 Що взяти: привід + акумулятор/газ, кулі, захист очей/обличчя, одяг по погоді, воду.
🆕 Немає спорядження? Є оренда — познач при реєстрації в боті.

ℹ️ Реєстрація на гру і чек-ін — через меню бота. Питання — пиши організаторам. Гарної гри!`,
};
