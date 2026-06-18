export type Lang = "pl" | "en" | "uk";

// Вибір мови за language_code Telegram. RU не підтримуємо → ru мапимо на uk.
export function pickLang(code?: string): Lang {
  if (!code) return "uk";
  const c = code.toLowerCase();
  if (c.startsWith("pl")) return "pl";
  if (c.startsWith("en")) return "en";
  return "uk"; // uk, ru та інші → українська
}

const FLAG: Record<Lang, string> = { pl: "🇵🇱", en: "🇬🇧", uk: "🇺🇦" };
const ORDER: Lang[] = ["pl", "en", "uk"];

// Збирає тримовний блок (PL / EN / UA) — одне повідомлення для всіх.
function tri(map: Record<Lang, string>): string {
  return ORDER.map((l) => `${FLAG[l]} ${map[l]}`).join("\n");
}

// Базові (fallback) тексти капчі — мапи по мовах. Можна перекрити в settings
// (captcha_*, cap_ok_*, cap_wrong_*, cap_expired_*) через lib/bot-texts.ts.
export const captchaPrompt: Record<Lang, string> = {
  pl: "Witaj w RX Team! Aby potwierdzić, że nie jesteś botem, rozwiąż zadanie:",
  en: "Welcome to RX Team! To confirm you're not a bot, solve:",
  uk: "Вітаємо в RX Team! Щоб підтвердити, що ти не бот, розв'яжи:",
};

export const correctMap: Record<Lang, string> = {
  pl: "Dziękujemy! Twoja prośba o dołączenie została zatwierdzona.",
  en: "Thanks! Your join request has been approved.",
  uk: "Дякуємо! Твою заявку на вступ підтверджено.",
};

export const wrongMap: Record<Lang, string> = {
  pl: "Niepoprawna odpowiedź. Możesz ponownie wysłać prośbę o dołączenie.",
  en: "Wrong answer. You can request to join again.",
  uk: "Невірна відповідь. Можеш подати заявку на вступ ще раз.",
};

export const expiredMap: Record<Lang, string> = {
  pl: "Czas minął. Wyślij prośbę o dołączenie ponownie.",
  en: "Time's up. Please request to join again.",
  uk: "Час вийшов. Подай заявку на вступ ще раз.",
};

export function captchaText(a: number, b: number): string {
  return `🪖\n${tri(captchaPrompt)}\n\n${a} + ${b} = ?`;
}

export const correctText = "✅\n" + tri(correctMap);
export const wrongText = "❌\n" + tri(wrongMap);
export const expiredText = "⏳\n" + tri(expiredMap);

// ЧЕРНЕТКА онбордингу — доопрацюємо з організатором (ліміти FPS/джоулів заповнить адмін).
export const faq: Record<Lang, string> = {
  pl: `🎯 RX Team — info dla nowych

🔫 Limity mocy (J/FPS): [do uzupełnienia przez organizatora]
🥽 Ochrona oczu OBOWIĄZKOWA przez całą grę.
🚩 "Trafiony" — podnosisz rękę / czerwoną szmatkę i idziesz do respawnu.
🤝 Fair play — zaliczaj trafienia.

🎒 Co zabrać: replika + akumulator/gaz, kulki, ochrona oczu/twarzy, ubranie na pogodę, woda.
🆕 Nie masz sprzętu? Jest wypożyczalnia — zaznacz przy rejestracji w bocie.

ℹ️ Rejestracja na grę i check-in — przez menu bota. Pytania — pisz do organizatorów. Miłej gry!

━━━━━━━━━━

📋 Zasady wątków grupy

💬 Zalew — luźny czat off-topic. Bez spamu i reklam. Szanuj innych.

🛒 Kupię/Sprzedam (Giełda) — kup i sprzedaj sprzęt ASG.
• Ogłoszenie = ZDJĘCIE + opis (cena, stan, kontakt). Sam tekst lub zdjęcie bez opisu = usuwane.
• Chcesz, by trafiło na stronę RX Team? Dodaj tag #promo w opisie i miej naszywkę. Po akceptacji admina ląduje ZA DARMO na stronie Giełdy na 30 dni.
• Bez #promo zdjęcie zostaje tylko w wątku. Bez naszywki — dostaniesz odmowę w wiadomości.

📣 Zapowiedzi gier — TYLKO bot. Posty graczy są usuwane.

📷 Zdjęcia i filmy z gier — TYLKO foto/wideo z gier. Tekst bez mediów jest usuwany.

⚠️ Łamanie zasad w wątkach = automatyczne, rosnące wyciszenie.`,

  en: `🎯 RX Team — info for newcomers

🔫 Power limits (J/FPS): [to be filled in by organizer]
🥽 Eye protection is MANDATORY for the whole game.
🚩 "Hit" — raise your hand / red rag and walk to respawn.
🤝 Fair play — call your hits.

🎒 What to bring: replica + battery/gas, BBs, eye/face protection, weather-appropriate clothes, water.
🆕 No gear? Rental is available — mark it during registration in the bot.

ℹ️ Game registration & check-in — via the bot menu. Questions — message the organizers. Have a good game!

━━━━━━━━━━

📋 Group topic rules

💬 Flood — free off-topic chat. No spam or ads. Respect others.

🛒 Buy/Sell (Marketplace) — buy and sell ASG gear.
• A listing = PHOTO + description (price, condition, contact). Plain text or a photo with no caption = deleted.
• Want it on the RX Team site? Add the #promo tag in the caption and have a patch. After an admin approves it, it goes FREE to the Marketplace page for 30 days.
• Without #promo the photo just stays in the thread. Without a patch you'll get a rejection DM.

📣 Game announcements — BOT ONLY. Player posts are deleted.

📷 Game photos & videos — photos/videos from games ONLY. Text without media is deleted.

⚠️ Breaking topic rules = automatic, escalating mute.`,

  uk: `🎯 RX Team — інфо для новачків

🔫 Ліміти потужності (Дж/FPS): [заповнить організатор]
🥽 Захист очей ОБОВ'ЯЗКОВИЙ протягом усієї гри.
🚩 "Поранений" — піднімаєш руку / червону ганчірку і йдеш у респ.
🤝 Чесна гра — зараховуй влучання.

🎒 Що взяти: привід + акумулятор/газ, кулі, захист очей/обличчя, одяг по погоді, воду.
🆕 Немає спорядження? Є оренда — познач при реєстрації в боті.

ℹ️ Реєстрація на гру і чек-ін — через меню бота. Питання — пиши організаторам. Гарної гри!

━━━━━━━━━━

📋 Правила гілок групи

💬 Флуд — вільний чат не за темою. Без спаму й реклами. Поважай інших.

🛒 Куплю/Продам (Барахолка) — купуй і продавай спорядження ASG.
• Оголошення = ФОТО + опис (ціна, стан, контакт). Лише текст або фото без опису = видаляється.
• Хочеш на сайт RX Team? Додай тег #promo в опис і май патч. Після схвалення адміна оголошення БЕЗКОШТОВНО потрапляє на сторінку Барахолки на 30 днів.
• Без #promo фото лишається тільки в гілці. Без патча — отримаєш відмову в особисті.

📣 Анонси ігор — ТІЛЬКИ бот. Дописи гравців видаляються.

📷 Фото та відео з ігор — ТІЛЬКИ фото/відео з ігор. Текст без медіа видаляється.

⚠️ Порушення правил гілок = автоматичне, наростаюче мовчання (mute).`,
};

// Онбординг — три мови підряд, розділені лінією.
export const faqText = ORDER.map((l) => `${FLAG[l]}\n${faq[l]}`).join(
  "\n\n━━━━━━━━━━\n\n",
);
