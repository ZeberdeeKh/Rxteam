import type { Lang } from "./i18n";

type Dict = Record<Lang, string>;

// Переклади інтерфейсу (показуються мовою гравця). Підтримують {плейсхолдери}.
const S: Record<string, Dict> = {
  start: {
    pl: "🪖 Cześć, operatorze! To bot drużyny RX Team — twój sztab do gier ASG.\n\nCo potrafi bot:\n• 📅 Ogłoszenia gier trafiają na grupę. Tutaj, w bocie, zapisujesz się na grę i widzisz, kto jedzie.\n• ✅ Na miejscu robisz check-in po geolokalizacji — i dostajesz punkty za udział.\n• ⭐ Za punkty pniesz się w rankingu najlepszych graczy.\n• 🚗 Podwozisz innych albo szukasz miejsca w aucie (carpool).\n\n🌐 Więcej funkcji znajdziesz na naszej stronie rxteam.pl — zalogujesz się do niej przez Telegram.\n\nKomendy menu:\n/profile — twój profil: stopień, gry, punkty, niezawodność\n/games — nadchodzące gry (zapis / wypis)\n/checkin — check-in na grze (po geolokalizacji)\n/top — najlepsi gracze\n/ref — link polecający (zaproś znajomego)\n/drivers — kierowcy na grę\n/myride — zarządzanie swoim przejazdem (dla kierowców)\n/rules — zasady / FAQ\n/lang — zmień język\n/cancel — anuluj bieżące działanie\n\nPytania? Wpisz /rules. Powodzenia na polu! 🎯",
    en: "🪖 Hey, operator! This is the RX Team bot — your HQ for ASG games.\n\nWhat the bot does:\n• 📅 Game announcements land in the group. Here in the bot you sign up for a game and see who's going.\n• ✅ On site you check in by geolocation — and earn points for attending.\n• ⭐ Points move you up the leaderboard.\n• 🚗 Offer a ride or grab a seat in someone's car (carpool).\n\n🌐 More features are on our site rxteam.pl — you can log in to it through Telegram.\n\nMenu commands:\n/profile — your profile: rank, games, points, reliability\n/games — upcoming games (sign up / withdraw)\n/checkin — check in at a game (by geolocation)\n/top — top players\n/ref — referral link (invite a friend)\n/drivers — drivers for a game\n/myride — manage your ride (for drivers)\n/rules — rules / FAQ\n/lang — change language\n/cancel — cancel current action\n\nQuestions? Hit /rules. Good luck on the field! 🎯",
    uk: "🪖 Вітаю, бійцю! Це бот команди RX Team — твій штаб для ASG-ігор.\n\nЩо вміє бот:\n• 📅 Анонси ігор приходять у групу. Тут, у боті, ти реєструєшся на гру й бачиш, хто їде.\n• ✅ На місці робиш чек-ін за геолокацією — і отримуєш бали за участь.\n• ⭐ За бали ростеш у топі найкращих гравців.\n• 🚗 Підвозиш інших або шукаєш місце в чужому авто (карпул).\n\n🌐 Більше функцій — на нашому сайті rxteam.pl, увійти в нього можна через Телеграм.\n\nКоманди меню:\n/profile — твій профіль: звання, ігри, бали, надійність\n/games — найближчі ігри (записатись / виписатись)\n/checkin — чек-ін на грі (за геолокацією)\n/top — топ гравців\n/ref — реферальне посилання (запроси друга)\n/drivers — водії на гру\n/myride — керування своєю поїздкою (для водіїв)\n/rules — правила / FAQ\n/lang — змінити мову\n/cancel — скасувати поточну дію\n\nПитання? Тисни /rules. Удачі на полі! 🎯",
  },
  lang_set: {
    pl: "✅ Język ustawiony: polski.",
    en: "✅ Language set: English.",
    uk: "✅ Мову встановлено: українська.",
  },
  profile: {
    pl: "👤 Profil\nImię: {name}\nPseudonim: {callsign}\nTG: {tg}\nStopień: {rank}\nNaszywka: {patch}\nRozegrane gry: {games}\n⭐ Zarobione: {earned}\n💰 Saldo: {balance}\n🎯 Niezawodność: {reliability}",
    en: "👤 Profile\nName: {name}\nCallsign: {callsign}\nTG: {tg}\nRank: {rank}\nPatch: {patch}\nGames played: {games}\n⭐ Earned: {earned}\n💰 Balance: {balance}\n🎯 Reliability: {reliability}",
    uk: "👤 Профіль\nІм'я: {name}\nПозивний: {callsign}\nTG: {tg}\nЗвання: {rank}\nНашивка: {patch}\nЗіграно ігор: {games}\n⭐ Зароблено: {earned}\n💰 Баланс: {balance}\n🎯 Надійність: {reliability}",
  },
  no_patch_label: {
    pl: "brak (potrzebny patch)",
    en: "none (patch needed)",
    uk: "немає (потрібен патч)",
  },
  patch_yes: { pl: "✅ jest", en: "✅ yes", uk: "✅ є" },
  patch_no: { pl: "❌ brak", en: "❌ no", uk: "❌ немає" },
  callsign_unset: {
    pl: "nie ustawiony (podasz przy pierwszej rejestracji)",
    en: "not set (you'll enter it at first sign-up)",
    uk: "не встановлено (впишеш при першій реєстрації)",
  },
  badge_master: { pl: "⭐ Master-admin", en: "⭐ Master admin", uk: "⭐ Майстер-адмін" },
  badge_admin: { pl: "🛡 Administrator", en: "🛡 Admin", uk: "🛡 Адмін" },
  not_admin: { pl: "⛔ Tylko dla adminów.", en: "⛔ Admins only.", uk: "⛔ Лише для адмінів." },
  admin_panel: {
    pl: "🛡 Panel admina\nUprawnienia: {perms}",
    en: "🛡 Admin panel\nPermissions: {perms}",
    uk: "🛡 Адмін-панель\nПрава: {perms}",
  },
  sethere_group_only: {
    pl: "Wykonaj tę komendę w grupie, w temacie „Ogłoszenia”.",
    en: "Run this command in the group, in the “Announcements” topic.",
    uk: "Виконай цю команду в групі, у топіку «Анонси».",
  },
  sethere_ok: {
    pl: "✅ Temat na ogłoszenia zapisany.",
    en: "✅ Announcements topic saved.",
    uk: "✅ Топік для анонсів збережено.",
  },
  loc_ask_name: {
    pl: "📍 Podaj nazwę lokacji:",
    en: "📍 Enter the location name:",
    uk: "📍 Введи назву локації:",
  },
  loc_ask_pin: {
    pl: "Wyślij punkt na mapie (📎 → Lokalizacja) albo wpisz współrzędne: 51.1523, 16.7717",
    en: "Send a map point (📎 → Location) or type coordinates: 51.1523, 16.7717",
    uk: "Надішли точку на карті (📎 → Локація) або впиши координати: 51.1523, 16.7717",
  },
  loc_bad_pin: {
    pl: "Nie rozumiem. Wyślij lokalizację lub wpisz: 51.1523, 16.7717",
    en: "Didn't get that. Send a location or type: 51.1523, 16.7717",
    uk: "Не зрозумів. Надішли локацію або впиши: 51.1523, 16.7717",
  },
  loc_ask_radius: {
    pl: "Promień strefy check-inu w metrach (wybierz lub wpisz):",
    en: "Check-in radius in meters (pick or type):",
    uk: "Радіус зони чек-іну в метрах (обери або впиши):",
  },
  loc_bad_radius: {
    pl: "Podaj liczbę w metrach (np. 300).",
    en: "Enter a number in meters (e.g. 300).",
    uk: "Введи число в метрах (напр. 300).",
  },
  loc_saved: {
    pl: "✅ Lokacja «{name}» zapisana (promień {radius} m).",
    en: "✅ Location «{name}» saved (radius {radius} m).",
    uk: "✅ Локацію «{name}» збережено (радіус {radius} м).",
  },
  locations_title: { pl: "📍 Lokacje:", en: "📍 Locations:", uk: "📍 Локації:" },
  locations_empty: {
    pl: "Brak lokacji. Dodaj: /addlocation",
    en: "No locations yet. Add one: /addlocation",
    uk: "Локацій ще немає. Додай: /addlocation",
  },
  cancelled: { pl: "Anulowano.", en: "Cancelled.", uk: "Скасовано." },

  // створення гри
  gamenew_no_loc: {
    pl: "Najpierw dodaj lokację: /addlocation",
    en: "Add a location first: /addlocation",
    uk: "Спершу додай локацію: /addlocation",
  },
  gamenew_no_topic: {
    pl: "⚠️ Najpierw ustaw temat ogłoszeń: /sethere w grupie.",
    en: "⚠️ Set the announcements topic first: /sethere in the group.",
    uk: "⚠️ Спершу встанови топік анонсів: /sethere у групі.",
  },
  gamenew_pick_loc: { pl: "Wybierz lokację:", en: "Pick a location:", uk: "Обери локацію:" },
  gamenew_date: {
    pl: "Data gry (DD.MM lub DD.MM.RRRR):",
    en: "Game date (DD.MM or DD.MM.YYYY):",
    uk: "Дата гри (ДД.ММ або ДД.ММ.РРРР):",
  },
  gamenew_bad_date: {
    pl: "Nie rozumiem daty. Format: 21.06 lub 21.06.2026",
    en: "Can't parse the date. Format: 21.06 or 21.06.2026",
    uk: "Не розумію дату. Формат: 21.06 або 21.06.2026",
  },
  gamenew_gather: {
    pl: "Godzina zbiórki (GG:MM, np. 09:00):",
    en: "Gathering time (HH:MM, e.g. 09:00):",
    uk: "Час збору (ГГ:ХХ, напр. 09:00):",
  },
  gamenew_start: {
    pl: "Godzina startu gry (GG:MM, np. 10:00):",
    en: "Game start time (HH:MM, e.g. 10:00):",
    uk: "Час старту гри (ГГ:ХХ, напр. 10:00):",
  },
  gamenew_bad_time: {
    pl: "Nie rozumiem godziny. Format: 09:00",
    en: "Can't parse the time. Format: 09:00",
    uk: "Не розумію час. Формат: 09:00",
  },
  gamenew_title: {
    pl: "Nazwa gry (łacinką, np. Fabryka cukru):",
    en: "Game title (Latin, e.g. Fabryka cukru):",
    uk: "Назва гри (латиницею, напр. Fabryka cukru):",
  },
  gamenew_scn_pl: {
    pl: "Opis/scenariusz PL:",
    en: "Description/scenario PL:",
    uk: "Опис/сценарій PL:",
  },
  gamenew_scn_uk: {
    pl: "Opis/scenariusz UA:",
    en: "Description/scenario UA:",
    uk: "Опис/сценарій UA:",
  },
  gamenew_cap: {
    pl: "Limit uczestników? Wpisz liczbę lub naciśnij przycisk:",
    en: "Participant limit? Type a number or tap the button:",
    uk: "Ліміт учасників? Впиши число або натисни кнопку:",
  },
  gamenew_nolimit: { pl: "Bez limitu", en: "No limit", uk: "Без ліміту" },
  gamenew_done: {
    pl: "✅ Gra #{id} utworzona, ogłoszenie opublikowane.\n📅 {when}\nRejestracja do {regclose}.",
    en: "✅ Game #{id} created, announcement posted.\n📅 {when}\nRegistration until {regclose}.",
    uk: "✅ Гру #{id} створено, анонс опубліковано.\n📅 {when}\nРеєстрація до {regclose}.",
  },
  gamenew_announce_failed: {
    pl: "⚠️ Gra utworzona, ale ogłoszenie nie zostało opublikowane (tekst może być za długi lub brak uprawnień w temacie).",
    en: "⚠️ Game created, but the announcement wasn't posted (text may be too long or no rights in the topic).",
    uk: "⚠️ Гру створено, але анонс не запостився (можливо, текст задовгий або немає прав у топіку).",
  },

  // картка гри + реєстрація
  game_card: {
    pl: "🎯 {title}\n📅 {when}",
    en: "🎯 {title}\n📅 {when}",
    uk: "🎯 {title}\n📅 {when}",
  },
  // Окремий рядок локації — показуємо лише коли вона відрізняється від назви гри
  // (у нас назва зазвичай і є локацією, тому не дублюємо).
  game_card_loc: {
    pl: "📍 {loc}",
    en: "📍 {loc}",
    uk: "📍 {loc}",
  },
  // Рядок лічильника гравців — додається до картки лише коли feature_announce_count != "false".
  game_card_count: {
    pl: "👥 Zapisani: {count}",
    en: "👥 Registered: {count}",
    uk: "👥 Записані: {count}",
  },
  btn_register: { pl: "✅ Zapisz się", en: "✅ Sign up", uk: "✅ Записатись" },
  btn_leave: { pl: "❌ Wypisz się", en: "❌ Leave", uk: "❌ Відписатись" },
  game_not_found: { pl: "Gra nie znaleziona.", en: "Game not found.", uk: "Гру не знайдено." },
  reg_closed: {
    pl: "Rejestracja zamknięta (mniej niż 9 godz. do startu).",
    en: "Registration closed (less than 9h before start).",
    uk: "Реєстрацію закрито (менше 9 год до старту).",
  },
  already_reg: {
    pl: "Już jesteś zapisany.",
    en: "You're already signed up.",
    uk: "Ти вже записаний.",
  },
  game_full: { pl: "Brak miejsc.", en: "No spots left.", uk: "Місць немає." },
  ask_callsign: {
    pl: "Podaj swój pseudonim (callsign) — ustawiasz go raz:",
    en: "Enter your callsign — set once:",
    uk: "Впиши свій позивний (callsign) — встановлюється один раз:",
  },
  callsign_taken: {
    pl: "Ten pseudonim jest zajęty, podaj inny:",
    en: "That callsign is taken, try another:",
    uk: "Цей позивний зайнятий, впиши інший:",
  },
  reg_done: {
    pl: "✅ Zapisano: {loc}, {when}.",
    en: "✅ Signed up: {loc}, {when}.",
    uk: "✅ Записано: {loc}, {when}.",
  },
  unreg_done: {
    pl: "Wypisano. Do zobaczenia następnym razem!",
    en: "You've left the game.",
    uk: "Тебе відписано.",
  },
  cancel_locked: {
    pl: "Wypisać można najpóźniej 24 godz. przed startem. Teraz nieobecność = minus punkty.",
    en: "You can leave up to 24h before start. Now a no-show = minus points.",
    uk: "Відписатись можна не пізніше ніж за 24 год до старту. Зараз неявка = мінус бали.",
  },

  // оренда + транспорт у реєстрації
  reg_rental_q: {
    pl: "Potrzebujesz wypożyczyć zestaw sprzętu?",
    en: "Do you need to rent a gear set?",
    uk: "Потрібна оренда комплекту спорядження?",
  },
  btn_yes: { pl: "Tak", en: "Yes", uk: "Так" },
  btn_no: { pl: "Nie", en: "No", uk: "Ні" },
  reg_transport_q: {
    pl: "Jak dojeżdżasz na grę?",
    en: "How are you getting to the game?",
    uk: "Як добираєшся на гру?",
  },
  btn_transport_own: { pl: "🚗 Własnym autem, podwiozę", en: "🚗 Driving, can give a lift", uk: "🚗 Своїм авто, підвезу" },
  btn_transport_need: { pl: "🙋 Potrzebuję transportu", en: "🙋 Need a ride", uk: "🙋 Потрібен транспорт" },
  // Для тих, хто не водій і не шукає транспорт — реєстрація завершується без даних про дорогу.
  btn_transport_skip: { pl: "⏭️ Pomiń", en: "⏭️ Skip", uk: "⏭️ Пропустити" },
  transport_need_noted: {
    pl: "Zapisane. Lista kierowców — /drivers.",
    en: "Noted. Driver list — /drivers.",
    uk: "Записано. Список водіїв — /drivers.",
  },
  transport_skip_noted: {
    pl: "OK, bez transportu.",
    en: "OK, no transport.",
    uk: "Гаразд, без транспорту.",
  },
  reg_from_q: {
    pl: "Skąd jedziesz? (dzielnica/miejsce)",
    en: "Where are you coming from? (district/place)",
    uk: "Звідки їдеш? (район/місце)",
  },
  reg_seats_q: {
    pl: "Ile wolnych miejsc możesz zabrać?",
    en: "How many free seats can you offer?",
    uk: "Скільки вільних місць можеш узяти?",
  },
  rental_noted: {
    pl: "🔫 Zaznaczyłeś wynajem — admin napisze do Ciebie ws. zestawu.",
    en: "🔫 Rental noted — an admin will message you about the set.",
    uk: "🔫 Оренду відмічено — адмін напише тобі щодо комплекту.",
  },
  admin_rental_notify: {
    pl: "🔫 {callsign} zapisał się z WYNAJMEM na «{title}» ({when}). Napisz ws. zestawu.",
    en: "🔫 {callsign} signed up with RENTAL for «{title}» ({when}). Message them about the set.",
    uk: "🔫 {callsign} записався з ОРЕНДОЮ на «{title}» ({when}). Напиши щодо комплекту.",
  },
  admin_purchase_notify: {
    pl: "🛒 Nowy zakup w sklepie!\n👤 Gracz: {who}\n📦 Towar: {item}\n💰 Koszt: {cost} pkt\n\nPotrzebne Twoje działanie — wydaj towar graczowi.",
    en: "🛒 New shop purchase!\n👤 Player: {who}\n📦 Item: {item}\n💰 Cost: {cost} pts\n\nAction needed — hand the item to the player.",
    uk: "🛒 Нова покупка в магазині!\n👤 Гравець: {who}\n📦 Товар: {item}\n💰 Вартість: {cost} балів\n\nПотрібна ваша дія — видайте товар гравцю.",
  },

  // чек-ін
  checkin_none: {
    pl: "Teraz nie ma gry do check-inu. Check-in otwiera się 30 min przed zbiórką (tylko dla zapisanych).",
    en: "No game to check in right now. Check-in opens 30 min before gathering (registered only).",
    uk: "Зараз немає гри для чек-іну. Чек-ін відкривається за 30 хв до збору (тільки для записаних).",
  },
  checkin_pick: {
    pl: "Wybierz grę do check-inu:",
    en: "Pick a game to check in:",
    uk: "Обери гру для чек-іну:",
  },
  checkin_prompt: {
    pl: "Naciśnij przycisk, aby udostępnić lokalizację do check-inu:",
    en: "Tap the button to share your location for check-in:",
    uk: "Натисни кнопку, щоб поділитися локацією для чек-іну:",
  },
  checkin_btn: {
    pl: "📍 Udostępnij lokalizację",
    en: "📍 Share location",
    uk: "📍 Поділитися локацією",
  },
  checkin_too_far: {
    pl: "❌ Jesteś {dist} m od strefy gry (trzeba ≤ {radius} m). Podejdź bliżej i udostępnij lokalizację ponownie.",
    en: "❌ You're {dist} m from the game zone (need ≤ {radius} m). Get closer and share location again.",
    uk: "❌ Ти за {dist} м від зони гри (треба ≤ {radius} м). Підійди ближче і поділись локацією ще раз.",
  },
  checkin_window_closed: {
    pl: "Check-in jest teraz niedostępny (poza oknem czasowym).",
    en: "Check-in is not available now (outside the time window).",
    uk: "Чек-ін зараз недоступний (поза вікном часу).",
  },
  checkin_done: {
    pl: "✅ Check-in zaliczony! Gra policzona (+1).",
    en: "✅ Check-in confirmed! Game counted (+1).",
    uk: "✅ Чек-ін зараховано! Гру зараховано (+1).",
  },
  checkin_already: {
    pl: "Już się zameldowałeś na tej grze.",
    en: "You've already checked in for this game.",
    uk: "Ти вже відмітився на цій грі.",
  },

  // /top — рейтинг
  top_title: {
    pl: "🏆 Ranking — rozegrane gry",
    en: "🏆 Leaderboard — games played",
    uk: "🏆 Рейтинг — зіграні ігри",
  },
  top_empty: {
    pl: "Nikt jeszcze nie rozegrał gry. Bądź pierwszy!",
    en: "No games played yet. Be the first!",
    uk: "Ще ніхто не зіграв жодної гри. Стань першим!",
  },
  top_line: {
    pl: "{place} {who} — {earned} ⭐ ({games} gier)",
    en: "{place} {who} — {earned} ⭐ ({games} games)",
    uk: "{place} {who} — {earned} ⭐ ({games} ігор)",
  },
  top_me: {
    pl: "📊 Twoje miejsce: {place} · {earned} ⭐ ({games} gier)",
    en: "📊 Your place: {place} · {earned} ⭐ ({games} games)",
    uk: "📊 Твоє місце: {place} · {earned} ⭐ ({games} ігор)",
  },

  // ручний чек-ін адміном (/markcheckin)
  mc_no_perm: {
    pl: "⛔ Brak uprawnienia „check-in”.",
    en: "⛔ You don't have the “check-in” permission.",
    uk: "⛔ Немає права «чек-ін».",
  },
  mc_no_games: { pl: "Brak gier.", en: "No games.", uk: "Ігор немає." },
  mc_pick_game: {
    pl: "Wybierz grę do ręcznego check-inu:",
    en: "Pick a game for manual check-in:",
    uk: "Обери гру для ручного чек-іну:",
  },
  mc_no_players: {
    pl: "Brak zapisanych graczy bez check-inu na tej grze.",
    en: "No registered players awaiting check-in for this game.",
    uk: "Немає записаних гравців без чек-іну на цій грі.",
  },
  mc_pick_player: {
    pl: "Wybierz gracza do odznaczenia obecności:",
    en: "Pick a player to mark present:",
    uk: "Обери гравця, щоб відмітити присутність:",
  },
  mc_done: {
    pl: "✅ {who} — check-in zaliczony (ręcznie, +1 gra).",
    en: "✅ {who} — checked in (manual, +1 game).",
    uk: "✅ {who} — чек-ін зараховано (вручну, +1 гра).",
  },
  mc_already: {
    pl: "{who} ma już check-in na tej grze.",
    en: "{who} is already checked in for this game.",
    uk: "{who} вже має чек-ін на цій грі.",
  },

  // патч (членство) — /patch
  patch_off: {
    pl: "Funkcja patcha jest teraz wyłączona.",
    en: "The patch feature is currently disabled.",
    uk: "Функція патча зараз вимкнена.",
  },
  patch_intro: {
    pl: "🎖 Patch RX Team = członkostwo.\nZ patchem: 100% punktów i możliwość kupowania stopni (Recruit → Scout → Squad Leader → Team Leader).\nBez patcha punkty naliczają się o 15% mniej i stopni kupić nie można.\nPatch jest płatny i wydawany na grze.",
    en: "🎖 RX Team patch = membership.\nWith the patch: 100% of points and you can buy ranks (Recruit → Scout → Squad Leader → Team Leader).\nWithout it points accrue 15% lower and ranks are locked.\nThe patch is paid and handed to you at a game.",
    uk: "🎖 Патч RX Team = членство.\nЗ патчем: 100% балів і можна купувати звання (Recruit → Scout → Squad Leader → Team Leader).\nБез патча бали капають на 15% менше, а звання купити не можна.\nПатч платний, видається на грі.",
  },
  patch_price_line: { pl: "Cena: {price} zł", en: "Price: {price} zł", uk: "Ціна: {price} zł" },
  btn_patch_request: {
    pl: "🎖 Złóż prośbę o patch",
    en: "🎖 Request the patch",
    uk: "🎖 Подати заявку на патч",
  },
  patch_status_have: {
    pl: "✅ Masz już patch. Witaj w RX Team!",
    en: "✅ You already have the patch. Welcome to RX Team!",
    uk: "✅ У тебе вже є патч. Вітаємо в RX Team!",
  },
  patch_pending: {
    pl: "⏳ Twoja prośba o patch czeka na decyzję admina.",
    en: "⏳ Your patch request is awaiting an admin's decision.",
    uk: "⏳ Твоя заявка на патч очікує рішення адміна.",
  },
  patch_approved_waiting: {
    pl: "✅ Prośba zatwierdzona — odbierzesz patch na najbliższej grze.",
    en: "✅ Request approved — you'll get the patch at the next game.",
    uk: "✅ Заявку схвалено — отримаєш патч на найближчій грі.",
  },
  patch_request_sent: {
    pl: "📨 Prośba o patch wysłana. Admin skontaktuje się i wyda patch na grze.",
    en: "📨 Patch request sent. An admin will reach out and hand you the patch at a game.",
    uk: "📨 Заявку на патч надіслано. Адмін зв'яжеться і видасть патч на грі.",
  },
  patch_admin_notify: {
    pl: "🎖 {who} prosi o patch. Zatwierdzić?",
    en: "🎖 {who} requests the patch. Approve?",
    uk: "🎖 {who} просить патч. Підтвердити?",
  },
  patch_already_handled: {
    pl: "Ta prośba została już obsłużona.",
    en: "This request has already been handled.",
    uk: "Цю заявку вже оброблено.",
  },
  patch_admin_approved: {
    pl: "✅ {who}: zatwierdzono. Po wydaniu patcha na grze naciśnij przycisk:",
    en: "✅ {who}: approved. Once you hand the patch at a game, tap:",
    uk: "✅ {who}: підтверджено. Після видачі патча на грі натисни:",
  },
  patch_admin_handed: {
    pl: "🎖 {who}: patch wydany, stopień Recruit.",
    en: "🎖 {who}: patch handed, rank Recruit.",
    uk: "🎖 {who}: патч видано, звання Recruit.",
  },
  patch_admin_rejected: { pl: "❌ {who}: odrzucono.", en: "❌ {who}: rejected.", uk: "❌ {who}: відхилено." },
  btn_approve: { pl: "✅ Zatwierdź", en: "✅ Approve", uk: "✅ Підтвердити" },
  btn_reject: { pl: "❌ Odrzuć", en: "❌ Reject", uk: "❌ Відхилити" },
  btn_handed: { pl: "🎖 Wydano na grze", en: "🎖 Handed at game", uk: "🎖 Видано на грі" },
  patch_you_approved: {
    pl: "✅ Twoja prośba o patch zatwierdzona — odbierzesz go na najbliższej grze.",
    en: "✅ Your patch request was approved — you'll get it at the next game.",
    uk: "✅ Твою заявку на патч схвалено — отримаєш його на найближчій грі.",
  },
  patch_you_rejected: {
    pl: "❌ Twoja prośba o patch została odrzucona. Napisz do admina po szczegóły.",
    en: "❌ Your patch request was rejected. Message an admin for details.",
    uk: "❌ Твою заявку на патч відхилено. Напиши адміну за деталями.",
  },
  patch_you_handed: {
    pl: "🎖 Patch wydany! Witaj w RX Team. Stopień: Recruit. Od teraz 100% punktów. Stopnie kupisz przez /rank.",
    en: "🎖 Patch handed! Welcome to RX Team. Rank: Recruit. 100% points from now on. Buy ranks via /rank.",
    uk: "🎖 Патч видано! Вітаємо в RX Team. Звання: Recruit. Відтепер 100% балів. Звання купуються через /rank.",
  },

  // звання — /rank
  econ_off: {
    pl: "Ekonomia jest teraz wyłączona.",
    en: "The economy is currently disabled.",
    uk: "Економіка зараз вимкнена.",
  },
  rank_with_next: {
    pl: "🎖 Stopień: {rank}\n💰 Saldo: {balance} pkt\nNastępny: {next} — koszt {cost} pkt",
    en: "🎖 Rank: {rank}\n💰 Balance: {balance} pts\nNext: {next} — cost {cost} pts",
    uk: "🎖 Звання: {rank}\n💰 Баланс: {balance} б.\nНаступне: {next} — ціна {cost} б.",
  },
  rank_max: {
    pl: "🎖 Stopień: {rank} — maksymalny. 💰 Saldo: {balance} pkt",
    en: "🎖 Rank: {rank} — top rank. 💰 Balance: {balance} pts",
    uk: "🎖 Звання: {rank} — максимальне. 💰 Баланс: {balance} б.",
  },
  rank_need_patch: {
    pl: "🎖 Stopień: brak — potrzebny patch.\n💰 Saldo: {balance} pkt\nStopnie odblokujesz po otrzymaniu patcha: /patch",
    en: "🎖 Rank: none — patch required.\n💰 Balance: {balance} pts\nRanks unlock once you get the patch: /patch",
    uk: "🎖 Звання: немає — потрібен патч.\n💰 Баланс: {balance} б.\nЗвання відкриються після отримання патча: /patch",
  },
  btn_buy_rank: {
    pl: "⬆️ Kup: {next} ({cost})",
    en: "⬆️ Buy: {next} ({cost})",
    uk: "⬆️ Купити: {next} ({cost})",
  },
  rank_not_enough: {
    pl: "Brakuje {need} pkt do stopnia {next}.",
    en: "You need {need} more pts for {next}.",
    uk: "Бракує {need} б. до звання {next}.",
  },
  rank_bought: {
    pl: "🎉 Gratulacje! Nowy stopień: {rank}. 💰 Saldo: {balance} pkt",
    en: "🎉 Congrats! New rank: {rank}. 💰 Balance: {balance} pts",
    uk: "🎉 Вітаємо! Нове звання: {rank}. 💰 Баланс: {balance} б.",
  },

  // ачівки
  ach_unlocked: {
    pl: "🏅 Osiągnięcie odblokowane: {title} (+{points} pkt)",
    en: "🏅 Achievement unlocked: {title} (+{points} pts)",
    uk: "🏅 Ачівку відкрито: {title} (+{points} б.)",
  },
  // DM при здобутті ачівки (будь-який шлях видачі) + посилання на свої ачівки на сайті
  ach_earned_dm: {
    pl: "🎖️ Zdobyłeś osiągnięcie «{title}» (+{points} pkt)\nZobacz wszystkie swoje osiągnięcia na stronie: {url}",
    en: "🎖️ You earned the achievement «{title}» (+{points} pts)\nSee all your achievements on the site: {url}",
    uk: "🎖️ Ти отримав ачівку «{title}» (+{points} б.)\nДивись усі свої ачівки на сайті: {url}",
  },

  // реферали — /ref
  ref_off: {
    pl: "Program poleceń jest teraz wyłączony.",
    en: "The referral program is currently disabled.",
    uk: "Реферальна програма зараз вимкнена.",
  },
  ref_need_play: {
    pl: "Najpierw rozegraj choć jedną grę (check-in) — wtedy będziesz mógł zapraszać znajomych.",
    en: "Play at least one game (check in) first — then you can invite friends.",
    uk: "Спершу зіграй хоча б одну гру (чек-ін) — тоді зможеш запрошувати друзів.",
  },
  ref_link: {
    pl: "🎟 Twój link polecający:\n{link}\n\nZapraszaj znajomych. Gdy nowicjusz zrobi pierwszy check-in — dostajesz +{pts} pkt i zniżkę na tę grę (1 znajomy −50%, 2+ za darmo).\nPotwierdzonych znajomych: {confirmed}",
    en: "🎟 Your referral link:\n{link}\n\nInvite friends. When a newcomer does their first check-in — you get +{pts} pts and a discount for that game (1 friend −50%, 2+ free).\nConfirmed friends: {confirmed}",
    uk: "🎟 Твоє реф-посилання:\n{link}\n\nЗапрошуй друзів. Коли новачок зробить перший чек-ін — тобі +{pts} балів і знижка на ту гру (1 друг −50%, 2+ безкоштовно).\nПідтверджених друзів: {confirmed}",
  },
  ref_disc_half: { pl: "−50% składki", en: "−50% off", uk: "−50% складки" },
  ref_disc_free: { pl: "za darmo", en: "free", uk: "безкоштовно" },
  ref_card_discount: {
    pl: "🎟 Twoja zniżka na tę grę: {discount}",
    en: "🎟 Your discount for this game: {discount}",
    uk: "🎟 Твоя знижка на цю гру: {discount}",
  },
  ref_bonus_inviter: {
    pl: "🎟 Twój znajomy {who} zrobił pierwszy check-in! +{pts} pkt. Zniżka na «{title}»: {discount}.",
    en: "🎟 Your friend {who} did their first check-in! +{pts} pts. Discount for «{title}»: {discount}.",
    uk: "🎟 Твій друг {who} зробив перший чек-ін! +{pts} балів. Знижка на «{title}»: {discount}.",
  },

  // /games — список найближчих ігор (записатись / виписатись з одного місця)
  games_none: {
    pl: "Brak nadchodzących gier.",
    en: "No upcoming games.",
    uk: "Зараз немає найближчих ігор.",
  },
  games_pick: {
    pl: "Nadchodzące gry — wybierz, aby się zapisać lub wypisać:",
    en: "Upcoming games — pick one to sign up or leave:",
    uk: "Найближчі ігри — обери, щоб записатись чи виписатись:",
  },

  // carpool — /drivers (пасажир) і /myride (водій)
  drivers_none_games: {
    pl: "Nie masz aktywnych zapisów na grę.",
    en: "You have no active game sign-ups.",
    uk: "Немає активних реєстрацій на гру.",
  },
  drivers_pick_game: { pl: "Wybierz grę:", en: "Pick a game:", uk: "Обери гру:" },
  drivers_title: {
    pl: "🚗 Kierowcy na «{title}»:",
    en: "🚗 Drivers for «{title}»:",
    uk: "🚗 Водії на «{title}»:",
  },
  drivers_empty: {
    pl: "Na razie nikt nie oferuje miejsc na tę grę.",
    en: "No one is offering seats for this game yet.",
    uk: "Поки що ніхто не пропонує місця на цю гру.",
  },
  drivers_line: {
    pl: "🚗 {who} — {from} · {seats} miejsc → {contact}",
    en: "🚗 {who} — {from} · {seats} seats → {contact}",
    uk: "🚗 {who} — {from} · {seats} місць → {contact}",
  },
  drivers_line_closed: {
    pl: "🚗 {who} — {from} · (komplet)",
    en: "🚗 {who} — {from} · (full)",
    uk: "🚗 {who} — {from} · (набір закрито)",
  },
  drivers_contact_none: {
    pl: "napisz w grupie",
    en: "write in the group",
    uk: "напиши в групі",
  },
  myride_none: {
    pl: "Nie jesteś kierowcą na żadnej grze (zapis „własnym autem”).",
    en: "You're not a driver for any game (signed up as „my own ride”).",
    uk: "Ти не водій на жодній грі (реєстрація «своїм ходом»).",
  },
  myride_pick: { pl: "Wybierz grę:", en: "Pick a game:", uk: "Обери гру:" },
  myride_panel: {
    pl: "🚗 «{title}»\nSkąd: {from}\nWolne miejsca: {seats}\nStatus: {status}",
    en: "🚗 «{title}»\nFrom: {from}\nFree seats: {seats}\nStatus: {status}",
    uk: "🚗 «{title}»\nЗвідки: {from}\nВільних місць: {seats}\nСтатус: {status}",
  },
  myride_status_open: { pl: "otwarty 🟢", en: "open 🟢", uk: "відкрито 🟢" },
  myride_status_closed: { pl: "komplet 🔴", en: "full 🔴", uk: "закрито 🔴" },
  btn_ride_close: { pl: "🔴 Zamknij nabór", en: "🔴 Close seats", uk: "🔴 Закрити набір" },
  btn_ride_open: { pl: "🟢 Otwórz nabór", en: "🟢 Open seats", uk: "🟢 Відкрити набір" },
  myride_hint: {
    pl: "🚗 Zapisano jako kierowca. Zarządzaj miejscami: /myride",
    en: "🚗 Signed up as a driver. Manage seats: /myride",
    uk: "🚗 Записано як водія. Керуй місцями: /myride",
  },

  // нагадування
  remind_day: {
    pl: "🔔 Przypomnienie: jutro gra «{title}» — {when}. Do zobaczenia!",
    en: "🔔 Reminder: tomorrow's game «{title}» — {when}. See you!",
    uk: "🔔 Нагадування: завтра гра «{title}» — {when}. До зустрічі!",
  },
  remind_2h: {
    pl: "⏰ Już niedługo! Start «{title}» o {when}. Pamiętaj o check-inie.",
    en: "⏰ Soon! «{title}» starts at {when}. Don't forget to check in.",
    uk: "⏰ Зовсім скоро! Старт «{title}» о {when}. Не забудь про чек-ін.",
  },

  // голосування за локацію — /poll, /pollclose
  poll_off: {
    pl: "Głosowanie jest teraz wyłączone.",
    en: "Voting is currently disabled.",
    uk: "Голосування зараз вимкнене.",
  },
  poll_need_loc: {
    pl: "Potrzebne min. 2 lokacje (/addlocation).",
    en: "Need at least 2 locations (/addlocation).",
    uk: "Потрібно щонайменше 2 локації (/addlocation).",
  },
  poll_posted: {
    pl: "✅ Głosowanie opublikowane w temacie. Zamknięcie: /pollclose",
    en: "✅ Poll posted in the topic. Close it: /pollclose",
    uk: "✅ Опитування опубліковано в топіку. Закрити: /pollclose",
  },
  poll_none_open: {
    pl: "Brak otwartego głosowania.",
    en: "No open poll.",
    uk: "Немає відкритого опитування.",
  },
  poll_closed_admin: { pl: "Głosowanie zamknięte.", en: "Poll closed.", uk: "Опитування закрито." },

  // лотерея надійних — /lottery
  lottery_off: {
    pl: "Loteria jest teraz wyłączona.",
    en: "The lottery is currently disabled.",
    uk: "Лотерея зараз вимкнена.",
  },
  lottery_already: {
    pl: "Loteria za {q} już przeprowadzona. Zwycięzca: {who}.",
    en: "Lottery for {q} already done. Winner: {who}.",
    uk: "Лотерею за {q} вже проведено. Переможець: {who}.",
  },
  lottery_no_eligible: {
    pl: "Za {q} nie ma graczy z check-inem i 0 nieobecności.",
    en: "For {q} there are no players with a check-in and 0 no-shows.",
    uk: "За {q} немає гравців із чек-іном і 0 неявок.",
  },
  lottery_done_admin: {
    pl: "✅ Loteria za {q}: uczestników {n}, zwycięzca {who}.",
    en: "✅ Lottery for {q}: {n} eligible, winner {who}.",
    uk: "✅ Лотерея за {q}: учасників {n}, переможець {who}.",
  },

  // прив'язка сайту — /linksite
  linksite_off: {
    pl: "Łączenie konta ze stroną jest teraz wyłączone.",
    en: "Linking your account to the site is currently disabled.",
    uk: "Прив'язка акаунта до сайту зараз вимкнена.",
  },
  linksite_msg: {
    pl: "🔗 Połącz konto ze stroną\nTwój kod: {code}\nWażny {min} min.\n\nWejdź na {url}, zaloguj się e-mailem i wpisz ten kod w profilu — historia będzie wspólna.",
    en: "🔗 Link your account to the site\nYour code: {code}\nValid for {min} min.\n\nGo to {url}, log in with e-mail and enter this code in your profile — your history will be shared.",
    uk: "🔗 Прив'яжи акаунт до сайту\nТвій код: {code}\nДіє {min} хв.\n\nЗайди на {url}, увійди через e-mail і впиши цей код у кабінеті — історія буде спільна.",
  },

  // «У цифрах» — /stats
  stats: {
    pl: "📊 W liczbach — {q}\nGry: {games}\nCheck-iny: {checkins}\nGracze: {players}\nNowicjusze: {newcomers}\nNieobecności: {noshows}",
    en: "📊 In numbers — {q}\nGames: {games}\nCheck-ins: {checkins}\nPlayers: {players}\nNewcomers: {newcomers}\nNo-shows: {noshows}",
    uk: "📊 У цифрах — {q}\nІгор: {games}\nЧек-інів: {checkins}\nГравців: {players}\nНовачків: {newcomers}\nНеявок: {noshows}",
  },

  // модерація топіка «Анонси» — повідомлення в приват порушнику
  announce_guard_warn: {
    pl: "⛔ Temat „Zapowiedzi gier” (RX Team) jest tylko do czytania — piszą tam wyłącznie ogłoszenia bota. Twoja wiadomość została usunięta. Za kolejną wiadomość w tym temacie dostaniesz wyciszenie w grupie na 1 godzinę.",
    en: "⛔ The «Game announcements» topic (RX Team) is read-only — only the bot posts announcements there. Your message was deleted. Another message in that topic will get you a 1-hour mute in the group.",
    uk: "⛔ Топік «Анонси ігор» (RX Team) — лише для читання, туди пише тільки бот. Твоє повідомлення видалено. За наступне повідомлення в цьому топіку отримаєш мут у групі на 1 годину.",
  },
  announce_guard_muted: {
    pl: "🔇 Zostałeś wyciszony w grupie RX Team na 1 godzinę. Powód: ponowne wiadomości w temacie „Zapowiedzi gier”, gdzie piszą tylko ogłoszenia (bot). Za godzinę znów napiszesz w innych tematach.",
    en: "🔇 You've been muted in the RX Team group for 1 hour. Reason: repeated messages in the «Game announcements» topic, which is for bot announcements only. In an hour you'll be able to post in other topics again.",
    uk: "🔇 Тебе заглушено в групі RX Team на 1 годину. Причина: повторні повідомлення в топіку «Анонси ігор», куди пише лише бот. Через годину знову зможеш писати в інших топіках.",
  },

  // гілка «тільки медіа» — повідомлення в приват порушнику (ескалація: попередження → попередження → мут)
  media_guard_warn: {
    pl: "🖼 Ten temat (RX Team) jest tylko na zdjęcia, wideo i pliki — bez dyskusji. Zasady:\n✅ Zdjęcie z opisem — OK\n✅ Zdjęcie/plik jako dokument — OK\n✅ Wideo — OK\n❌ Sam tekst — usuwany\n\nTwoja wiadomość została usunięta. Chcesz to omówić? Pisz w temacie «Zalew» (flood). Kolejna wiadomość tekstowa tutaj = ostatnie ostrzeżenie, a potem wyciszenie w grupie na 1 godzinę.",
    en: "🖼 This topic (RX Team) is for photos, videos and files only — no chatter. Rules:\n✅ Photo with a caption — OK\n✅ Photo/file as a document — OK\n✅ Video — OK\n❌ Plain text — removed\n\nYour message was deleted. Want to discuss it? Use the «Zalew» (flood) topic. Another text message here = a last warning, then a 1-hour mute in the group.",
    uk: "🖼 Ця гілка (RX Team) — лише для фото, відео й файлів, без обговорень. Правила:\n✅ Фото з описом — ОК\n✅ Фото/файл документом — ОК\n✅ Відео — ОК\n❌ Самий текст — видаляється\n\nТвоє повідомлення видалено. Хочеш це обговорити? Пиши в гілці «Zalew» (флуд). Наступне текстове повідомлення тут = останнє попередження, а потім мут у групі на 1 годину.",
  },
  media_guard_warn2: {
    pl: "⚠️ Drugie (ostatnie) ostrzeżenie. Ten temat jest tylko na zdjęcia/wideo/pliki — dyskusje pisz w temacie «Zalew» (flood). Następna wiadomość tekstowa tutaj = wyciszenie w grupie na 1 godzinę.",
    en: "⚠️ Second (final) warning. This topic is for photos/videos/files only — take discussions to the «Zalew» (flood) topic. Your next text message here = a 1-hour mute in the group.",
    uk: "⚠️ Друге (останнє) попередження. Ця гілка — лише для фото/відео/файлів, обговорення пиши в гілці «Zalew» (флуд). Наступне текстове повідомлення тут = мут у групі на 1 годину.",
  },
  media_guard_muted: {
    pl: "🔇 Zostałeś wyciszony w grupie RX Team na 1 godzinę. Powód: powtarzające się wiadomości tekstowe w temacie tylko-media (zdjęcia/wideo/pliki). Dyskusje pisz w temacie «Zalew» (flood). Za godzinę znów napiszesz w innych tematach.",
    en: "🔇 You've been muted in the RX Team group for 1 hour. Reason: repeated text messages in the media-only topic (photos/videos/files). Take discussions to the «Zalew» (flood) topic. In an hour you'll be able to post in other topics again.",
    uk: "🔇 Тебе заглушено в групі RX Team на 1 годину. Причина: повторні текстові повідомлення в гілці «тільки медіа» (фото/відео/файли). Обговорення пиши в гілці «Zalew» (флуд). Через годину знову зможеш писати в інших гілках.",
  },
};

// Двомовний (PL/UA) пост переможця лотереї у топік.
export function lotteryWinnerText(label: string, who: string, n: number): string {
  return `🎉 Loteria niezawodnych ${label}: zwycięzca ${who} (z ${n})! / Лотерея надійних ${label}: переможець ${who} (з ${n})!`;
}

// Двомовний (PL/UA) текст для постів у групу — питання опитування і результат.
export const POLL_QUESTION = "📊 Gdzie gramy następnym razem? / Де граємо наступного разу?";
export function pollWinnerText(loc: string, votes: number): string {
  return `🏁 Zwycięzca głosowania: ${loc} (${votes}) / Переможець голосування: ${loc} (${votes})`;
}

export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = (S[key] && (S[key][lang] ?? S[key].en)) ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
