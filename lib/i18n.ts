export type Lang = "pl" | "en" | "uk";

const FLAG: Record<Lang, string> = { pl: "🇵🇱", en: "🇬🇧", uk: "🇺🇦" };
const ORDER: Lang[] = ["pl", "en", "uk"];

// Збирає тримовний блок (PL / EN / UA) — одне повідомлення для всіх.
function tri(map: Record<Lang, string>): string {
  return ORDER.map((l) => `${FLAG[l]} ${map[l]}`).join("\n");
}

const captchaPrompt: Record<Lang, string> = {
  pl: "Witaj w RX Team! Aby potwierdzić, że nie jesteś botem, rozwiąż zadanie:",
  en: "Welcome to RX Team! To confirm you're not a bot, solve:",
  uk: "Вітаємо в RX Team! Щоб підтвердити, що ти не бот, розв'яжи:",
};

export function captchaText(a: number, b: number): string {
  return `🪖\n${tri(captchaPrompt)}\n\n${a} + ${b} = ?`;
}

export const correctText =
  "✅\n" +
  tri({
    pl: "Dziękujemy! Twoja prośba o dołączenie została zatwierdzona.",
    en: "Thanks! Your join request has been approved.",
    uk: "Дякуємо! Твою заявку на вступ підтверджено.",
  });

export const wrongText =
  "❌\n" +
  tri({
    pl: "Niepoprawna odpowiedź. Możesz ponownie wysłać prośbę o dołączenie.",
    en: "Wrong answer. You can request to join again.",
    uk: "Невірна відповідь. Можеш подати заявку на вступ ще раз.",
  });

export const expiredText =
  "⏳\n" +
  tri({
    pl: "Czas minął. Wyślij prośbę o dołączenie ponownie.",
    en: "Time's up. Please request to join again.",
    uk: "Час вийшов. Подай заявку на вступ ще раз.",
  });

// Привітання на /start (тримовне).
export const startText =
  "🪖 RX Team Bot\n\n" +
  tri({
    pl: "Cześć, operatorze! Wkrótce zapiszesz się tu na grę, zrobisz check-in i sprawdzisz swój stopień. Bądź w gotowości!",
    en: "Hey, operator! Soon you'll sign up for games here, check in and track your rank. Stay ready!",
    uk: "Привіт, бійцю! Скоро тут реєструватимешся на гру, робитимеш чек-ін і дивитимешся своє звання. Будь напоготові!",
  });

// ЧЕРНЕТКА онбордингу — доопрацюємо з організатором (ліміти FPS/джоулів заповнить адмін).
const faq: Record<Lang, string> = {
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

// Онбординг — три мови підряд, розділені лінією.
export const faqText = ORDER.map((l) => `${FLAG[l]}\n${faq[l]}`).join(
  "\n\n━━━━━━━━━━\n\n",
);
