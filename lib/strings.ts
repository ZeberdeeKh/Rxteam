import type { Lang } from "./i18n";

type Dict = Record<Lang, string>;

// Переклади інтерфейсу (показуються мовою гравця). Підтримують {плейсхолдери}.
const S: Record<string, Dict> = {
  start: {
    pl: "🪖 Cześć, operatorze! To bot drużyny RX Team — twój sztab do gier ASG.\n\nCo potrafi bot:\n• 📅 Ogłoszenia gier trafiają na grupę. Tutaj, w bocie, zapisujesz się na grę i widzisz, kto jedzie.\n• ✅ Na miejscu robisz check-in po geolokalizacji — i dostajesz punkty za udział.\n• ⭐ Za punkty pniesz się w rankingu najlepszych graczy.\n• 🚗 Podwozisz innych albo szukasz miejsca w aucie (carpool).\n\n🌐 Więcej funkcji znajdziesz na naszej stronie rxteam.pl — zalogujesz się do niej przez Telegram.\n\nKomendy menu:\n/profile — twój profil: ranga, gry, punkty, niezawodność\n/games — nadchodzące gry (zapis / wypis)\n/checkin — check-in na grze (po geolokalizacji)\n/top — najlepsi gracze\n/ref — link polecający (zaproś znajomego)\n/drivers — kierowcy na grę\n/myride — zarządzanie swoim przejazdem (dla kierowców)\n/rules — zasady / FAQ\n/lang — zmień język\n/cancel — anuluj bieżące działanie\n\nPytania? Wpisz /rules. Powodzenia na polu! 🎯",
    en: "🪖 Hey, operator! This is the RX Team bot — your HQ for ASG games.\n\nWhat the bot does:\n• 📅 Game announcements land in the group. Here in the bot you sign up for a game and see who's going.\n• ✅ On site you check in by geolocation — and earn points for attending.\n• ⭐ Points move you up the leaderboard.\n• 🚗 Offer a ride or grab a seat in someone's car (carpool).\n\n🌐 More features are on our site rxteam.pl — you can log in to it through Telegram.\n\nMenu commands:\n/profile — your profile: rank, games, points, reliability\n/games — upcoming games (sign up / withdraw)\n/checkin — check in at a game (by geolocation)\n/top — top players\n/ref — referral link (invite a friend)\n/drivers — drivers for a game\n/myride — manage your ride (for drivers)\n/rules — rules / FAQ\n/lang — change language\n/cancel — cancel current action\n\nQuestions? Hit /rules. Good luck on the field! 🎯",
    uk: "🪖 Вітаю, бійцю! Це бот команди RX Team — твій штаб для ASG-ігор.\n\nЩо вміє бот:\n• 📅 Анонси ігор приходять у групу. Тут, у боті, ти реєструєшся на гру й бачиш, хто їде.\n• ✅ На місці робиш чек-ін за геолокацією — і отримуєш бали за участь.\n• ⭐ За бали ростеш у топі найкращих гравців.\n• 🚗 Підвозиш інших або шукаєш місце в чужому авто (карпул).\n\n🌐 Більше функцій — на нашому сайті rxteam.pl, увійти в нього можна через Телеграм.\n\nКоманди меню:\n/profile — твій профіль: ранг, ігри, бали, надійність\n/games — найближчі ігри (записатись / виписатись)\n/checkin — чек-ін на грі (за геолокацією)\n/top — топ гравців\n/ref — реферальне посилання (запроси друга)\n/drivers — водії на гру\n/myride — керування своєю поїздкою (для водіїв)\n/rules — правила / FAQ\n/lang — змінити мову\n/cancel — скасувати поточну дію\n\nПитання? Тисни /rules. Удачі на полі! 🎯",
  },
  lang_set: {
    pl: "✅ Język ustawiony: polski.",
    en: "✅ Language set: English.",
    uk: "✅ Мову встановлено: українська.",
  },
  profile: {
    pl: "👤 Profil\nImię: {name}\nPseudonim: {callsign}\nTG: {tg}\nRanga: {rank}\nNaszywka: {patch}\nRozegrane gry: {games}\n⭐ Zarobione: {earned}\n💰 Saldo: {balance}\n🎯 Niezawodność: {reliability}",
    en: "👤 Profile\nName: {name}\nCallsign: {callsign}\nTG: {tg}\nRank: {rank}\nPatch: {patch}\nGames played: {games}\n⭐ Earned: {earned}\n💰 Balance: {balance}\n🎯 Reliability: {reliability}",
    uk: "👤 Профіль\nІм'я: {name}\nПозивний: {callsign}\nTG: {tg}\nРанг: {rank}\nПатч: {patch}\nЗіграно ігор: {games}\n⭐ Зароблено: {earned}\n💰 Баланс: {balance}\n🎯 Надійність: {reliability}",
  },
  no_patch_label: {
    pl: "brak (potrzebna naszywka)",
    en: "none (patch needed)",
    uk: "немає (потрібен патч)",
  },
  patch_yes: { pl: "✅ jest", en: "✅ yes", uk: "✅ є" },
  patch_no: { pl: "❌ brak", en: "❌ no", uk: "❌ немає" },
  // Наявність патча в /profile: «Отримано <дата>» (дата видачі — patch_at).
  patch_received: { pl: "✅ Otrzymano", en: "✅ Received", uk: "✅ Отримано" },
  // Підказка в /profile, коли патча ще немає — як подати заявку.
  patch_profile_hint: {
    pl: "ℹ️ Nie masz jeszcze naszywki. Złóż prośbę o jej wydanie komendą /patch",
    en: "ℹ️ No patch yet. Request it with the /patch command",
    uk: "ℹ️ Подати заявку на отримання патча можна командою /patch",
  },
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

  // ── Прив'язка топіків (set*-команди): підтвердження адміну його мовою (pl/en/uk).
  // {chat}/{thread} — технічні id (мовно-нейтральні), підставляються в коді. ──
  not_admin_group: {
    pl: "⛔ Tylko dla adminów grupy.",
    en: "⛔ Group admins only.",
    uk: "⛔ Лише для адмінів групи.",
  },
  setchores_group_only: {
    pl: "Wykonaj tę komendę w grupie adminów (we właściwym temacie).",
    en: "Run this command in the admin group (in the right topic).",
    uk: "Виконай цю команду в адмін-групі (у потрібному топіку).",
  },
  sethere_ok_topic: {
    pl: "✅ Temat ogłoszeń zapisany.\nchat_id: {chat}\nthread_id: {thread}\n\nTeraz w tym temacie pisze tylko bot — pozostałe wiadomości bot będzie usuwał.",
    en: "✅ Announcements topic saved.\nchat_id: {chat}\nthread_id: {thread}\n\nNow only the bot posts in this topic — other messages will be deleted.",
    uk: "✅ Тему для анонсів збережено.\nchat_id: {chat}\nthread_id: {thread}\n\nТепер у цій темі пише лише бот — решту повідомлень бот видалятиме.",
  },
  sethere_ok_general: {
    pl: "✅ Zapisano: wątek ogłoszeń to temat główny «General» (pierwszy temat forum nie ma thread_id, to normalne).\nchat_id: {chat}\n\nTeraz tutaj pisze tylko bot — pozostałe wiadomości bot będzie usuwał.",
    en: "✅ Saved: the announcements thread is the main «General» topic (the first forum topic has no thread_id, that's normal).\nchat_id: {chat}\n\nNow only the bot posts here — other messages will be deleted.",
    uk: "✅ Збережено: гілка анонсів — головна тема «General» (для першої теми форуму thread_id немає, це нормально).\nchat_id: {chat}\n\nТепер тут пише лише бот — решту повідомлень бот видалятиме.",
  },
  setchores_ok: {
    pl: "✅ Grupa do checklist przygotowań zapisana.\nchat_id: {chat}{thread}\n\nTeraz przy ogłoszeniu gry przyleci tu interaktywna lista zadań.",
    en: "✅ Prep-checklist group saved.\nchat_id: {chat}{thread}\n\nNow an interactive task list will arrive here when a game is announced.",
    uk: "✅ Групу для чек-листів підготовки збережено.\nchat_id: {chat}{thread}\n\nТепер при анонсі гри сюди прилітатиме інтерактивний список завдань.",
  },
  setmedia_ok_topic: {
    pl: "✅ Wątek «tylko media» zapisany.\nchat_id: {chat}\nthread_id: {thread}\n\nTu zostają tylko zdjęcia / wideo / pliki (z podpisem lub bez) — wiadomości tekstowe bot będzie usuwał. Admini i master — wyjątek.",
    en: "✅ «Media only» topic saved.\nchat_id: {chat}\nthread_id: {thread}\n\nOnly photos / videos / files stay here (with or without a caption) — text messages will be deleted. Admins and the master are an exception.",
    uk: "✅ Гілку «тільки медіа» збережено.\nchat_id: {chat}\nthread_id: {thread}\n\nТут лишаються лише фото / відео / файли (з підписом чи без) — текстові повідомлення бот видалятиме. Адміни й майстер — виняток.",
  },
  setmedia_ok_general: {
    pl: "✅ Zapisano: wątek «tylko media» to temat główny «General» (pierwszy temat forum nie ma thread_id, to normalne).\nchat_id: {chat}\n\nTu zostają tylko zdjęcia / wideo / pliki (z podpisem lub bez) — wiadomości tekstowe bot będzie usuwał. Admini i master — wyjątek.",
    en: "✅ Saved: the «media only» thread is the main «General» topic (the first forum topic has no thread_id, that's normal).\nchat_id: {chat}\n\nOnly photos / videos / files stay here (with or without a caption) — text messages will be deleted. Admins and the master are an exception.",
    uk: "✅ Збережено: гілка «тільки медіа» — головна тема «General» (для першої теми форуму thread_id немає, це нормально).\nchat_id: {chat}\n\nТут лишаються лише фото / відео / файли (з підписом чи без) — текстові повідомлення бот видалятиме. Адміни й майстер — виняток.",
  },
  setphotos_ok_topic: {
    pl: "✅ Temat punktów za zdjęcia zapisany.\nchat_id: {chat}\nthread_id: {thread}\n\nZa zdjęcie/wideo tutaj powiązany gracz dostaje 1 punkt za post (album = 1 post). Limit — w ustawieniach.",
    en: "✅ Photo-points topic saved.\nchat_id: {chat}\nthread_id: {thread}\n\nFor a photo/video here a linked player gets 1 point per post (an album = 1 post). The limit is in settings.",
    uk: "✅ Топік для балів за фото збережено.\nchat_id: {chat}\nthread_id: {thread}\n\nЗа фото/відео тут прив'язаний гравець отримує 1 бал за пост (альбом = 1 пост). Ліміт — у налаштуваннях.",
  },
  setphotos_ok_general: {
    pl: "✅ Zapisano: temat punktów za zdjęcia to temat główny «General».\nchat_id: {chat}\n\nZa zdjęcie/wideo tutaj powiązany gracz dostaje 1 punkt za post (album = 1 post). Limit — w ustawieniach.",
    en: "✅ Saved: the photo-points topic is the main «General» topic.\nchat_id: {chat}\n\nFor a photo/video here a linked player gets 1 point per post (an album = 1 post). The limit is in settings.",
    uk: "✅ Збережено: топік для балів за фото — головна тема «General».\nchat_id: {chat}\n\nЗа фото/відео тут прив'язаний гравець отримує 1 бал за пост (альбом = 1 пост). Ліміт — у налаштуваннях.",
  },
  setflood_ok: {
    pl: "✅ Wątek «Flood/Zalew» do codziennego przypomnienia zapisany.\nchat_id: {chat}{thread}\n\nCodziennie o ustalonej godzinie (Ustawienia → «Codzienne przypomnienie») bot będzie tu wysyłał dwujęzyczne przypomnienie o zapisach, jeśli w tym tygodniu jest jeszcze gra.",
    en: "✅ The «Flood/Zalew» thread for the daily reminder is saved.\nchat_id: {chat}{thread}\n\nEvery day at the set hour (Settings → «Daily reminder») the bot will post a bilingual sign-up reminder here, if there's still a game this week.",
    uk: "✅ Гілку «Флуд/Zalew» для щоденного нагадування збережено.\nchat_id: {chat}{thread}\n\nЩодня о заданій годині (Налаштування → «Щоденне нагадування») бот постітиме сюди двомовне нагадування про реєстрацію, якщо цього тижня попереду є гра.",
  },
  setsales_ok: {
    pl: "✅ Wątek «Giełda» zapisany.\nchat_id: {chat}{thread}\n\nZasady wątku:\n• tylko ZDJĘCIE z opisem (tekst / wideo / pliki oraz zdjęcia bez opisu — usuwane);\n• aby ogłoszenie trafiło na stronę — dodaj w opisie tag #promo (wymagana naszywka);\n• zdjąć ogłoszenie — odpowiedz /delete na swoje zdjęcie (lub prześlij je ponownie + /delete).",
    en: "✅ The «Marketplace» thread is saved.\nchat_id: {chat}{thread}\n\nThread rules:\n• photos WITH a description only (text / videos / files and photos without a caption are deleted);\n• to get a listing on the site — add the #promo tag to the caption (a patch is required);\n• to remove a listing — reply /delete to your photo (or repost it + /delete).",
    uk: "✅ Гілку «Барахолка» збережено.\nchat_id: {chat}{thread}\n\nПравила гілки:\n• лише ФОТО з описом (текст / відео / файли та фото без опису — видаляються);\n• щоб оголошення потрапило на сайт — додай у опис тег #promo (потрібен патч);\n• зняти оголошення — відповідь /delete на своє фото (або репост потрібного + /delete).",
  },
  bug_report_header: {
    pl: "🐞 Zgłoszenie błędu",
    en: "🐞 Bug report",
    uk: "🐞 Звіт про помилку",
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
  callsign_bad: {
    pl: "Nieprawidłowy pseudonim (2–32 znaki: litery, cyfry, spacja, _ . -). Podaj inny:",
    en: "Invalid callsign (2–32 chars: letters, digits, space, _ . -). Try another:",
    uk: "Некоректний позивний (2–32 символи: літери, цифри, пробіл, _ . -). Впиши інший:",
  },
  // Підтвердження позивного при першій реєстрації (ставиться один раз).
  callsign_confirm_q: {
    pl: "Twój pseudonim: {callsign}\n\nUstawiasz go raz. Zmiana później — tylko w sklepie za punkty lub po zdobyciu rangi Squad Leader.\n\nPotwierdzić?",
    en: "Your callsign: {callsign}\n\nSet once. Changing it later — only in the shop for points or after reaching the Squad Leader rank.\n\nConfirm?",
    uk: "Твій позивний: {callsign}\n\nВстановлюється один раз. Змінити згодом — лише в магазині за бали або отримавши ранг Squad Leader.\n\nПідтвердити?",
  },
  btn_callsign_confirm: { pl: "✅ Potwierdź", en: "✅ Confirm", uk: "✅ Підтвердити" },
  btn_callsign_cancel: { pl: "✖️ Anuluj", en: "✖️ Cancel", uk: "✖️ Скасувати" },
  callsign_cancelled: {
    pl: "Anulowano. Podaj inny pseudonim:",
    en: "Cancelled. Enter another callsign:",
    uk: "Скасовано. Впиши інший позивний:",
  },
  callsign_set: {
    pl: "✅ Pseudonim ustawiony: {callsign}",
    en: "✅ Callsign set: {callsign}",
    uk: "✅ Позивний встановлено: {callsign}",
  },
  // Зміна позивного за бали (/callsign). Squad Leader+ — безкоштовно.
  callsign_change_ask: {
    pl: "Podaj nowy pseudonim. Koszt: {cost} pkt.",
    en: "Enter a new callsign. Cost: {cost} pts.",
    uk: "Впиши новий позивний. Ціна: {cost} б.",
  },
  callsign_change_ask_free: {
    pl: "Podaj nowy pseudonim (za darmo — ranga Squad Leader+):",
    en: "Enter a new callsign (free — Squad Leader+ rank):",
    uk: "Впиши новий позивний (безкоштовно — ранг Squad Leader+):",
  },
  callsign_change_done: {
    pl: "✅ Pseudonim zmieniony: {callsign}",
    en: "✅ Callsign changed: {callsign}",
    uk: "✅ Позивний змінено: {callsign}",
  },
  callsign_change_not_enough: {
    pl: "Za mało punktów: potrzeba {cost}, masz {balance}.",
    en: "Not enough points: need {cost}, you have {balance}.",
    uk: "Недостатньо балів: потрібно {cost}, у тебе {balance}.",
  },
  callsign_change_same: {
    pl: "To już Twój pseudonim. Podaj inny:",
    en: "That's already your callsign. Enter another:",
    uk: "Це вже твій позивний. Впиши інший:",
  },
  callsign_change_off: {
    pl: "Zmiana pseudonimu jest teraz niedostępna.",
    en: "Callsign change is currently unavailable.",
    uk: "Зміна позивного зараз недоступна.",
  },
  callsign_change_need_first: {
    pl: "Najpierw ustaw pseudonim (zapisz się na grę).",
    en: "Set your callsign first (sign up for a game).",
    uk: "Спершу встанови позивний (запишись на гру).",
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
    pl: "Funkcja naszywki jest teraz wyłączona.",
    en: "The patch feature is currently disabled.",
    uk: "Функція патча зараз вимкнена.",
  },
  // Ціновий рядок — те саме формулювання, що в кабінеті на сайті (patch_price_line_site).
  patch_price_line: { pl: "Wsparcie społeczności: {price} zł", en: "Community donation: {price} zł", uk: "Внесок на розвиток спільноти: {price} zł" },
  // Крок 2 (patchreq): детальне пояснення перед повторним підтвердженням заявки.
  patch_benefits: {
    pl: "🎖 Naszywka RX Team — to Twoje członkostwo we wspólnocie.\n\nKoszt naszywki to darowizna na rozwój wspólnoty RX Team (gry, sprzęt, wydarzenia), a nie zwykła opłata za rzecz.\n\nCo daje naszywka:\n• Pierwsza ranga w grupie — Recruit (dalej: Scout → Squad Leader → Team Leader).\n• 100% punktów za udział w grach i wydarzeniach — bez naszywki nalicza się o 15% mniej.\n• Udział w losowaniach nagród — często losujemy je tylko wśród posiadaczy naszywki.\n• Ranga w grupie wpływa na Twoją rolę i funkcję jako gracza na grach milsim.\n\nNaszywka wydawana jest osobiście na grze.",
    en: "🎖 The RX Team patch is your membership in the community.\n\nThe patch fee is a donation toward the RX Team community (games, gear, events) — not just a payment for an item.\n\nWhat the patch gives you:\n• Your first rank in the group — Recruit (then: Scout → Squad Leader → Team Leader).\n• 100% of points for attending games and events — without the patch you earn 15% less.\n• Entry into prize raffles — we often hold them only among patch holders.\n• Your rank in the group affects your role and function as a player at milsim games.\n\nThe patch is handed to you in person at a game.",
    uk: "🎖 Патч RX Team — це твоє членство у спільноті.\n\nВартість патча — це донат на розвиток спільноти RX Team (ігри, реквізит, події), а не просто оплата за річ.\n\nЩо дає патч:\n• Перший ранг в групі — Recruit (далі: Scout → Squad Leader → Team Leader).\n• 100% балів за відвідування ігор і подій — без патча нараховується на 15% менше.\n• Участь у розіграшах призів — ми часто розігруємо їх лише серед власників патча.\n• Ранг в групі впливає на твою роль і функцію як гравця на мілсім-іграх.\n\nПатч видається особисто на грі.",
  },
  patch_confirm_hint: {
    pl: "Naciśnij „Potwierdź prośbę” jeszcze raz — wyślemy zgłoszenie do admina do zatwierdzenia.",
    en: "Tap \"Confirm request\" once more — we'll send your application to an admin for approval.",
    uk: "Натисни «Підтвердити запит» ще раз — і ми надішлемо заявку адміну на схвалення.",
  },
  btn_patch_confirm: {
    pl: "✅ Potwierdź prośbę",
    en: "✅ Confirm request",
    uk: "✅ Підтвердити запит",
  },
  btn_patch_request: {
    pl: "🎖 Złóż prośbę o naszywkę",
    en: "🎖 Request the patch",
    uk: "🎖 Подати заявку на патч",
  },
  patch_status_have: {
    pl: "✅ Masz już naszywkę. Witaj w RX Team!",
    en: "✅ You already have the patch. Welcome to RX Team!",
    uk: "✅ У тебе вже є патч. Вітаємо в RX Team!",
  },
  patch_pending: {
    pl: "⏳ Twoja prośba o naszywkę czeka na decyzję admina.",
    en: "⏳ Your patch request is awaiting an admin's decision.",
    uk: "⏳ Твоя заявка на патч очікує рішення адміна.",
  },
  patch_approved_waiting: {
    pl: "✅ Prośba zatwierdzona — odbierzesz naszywkę na najbliższej grze.",
    en: "✅ Request approved — you'll get the patch at the next game.",
    uk: "✅ Заявку схвалено — отримаєш патч на найближчій грі.",
  },
  patch_request_sent: {
    pl: "📨 Prośba o naszywkę wysłana. Admin skontaktuje się i wyda naszywkę na grze.",
    en: "📨 Patch request sent. An admin will reach out and hand you the patch at a game.",
    uk: "📨 Заявку на патч надіслано. Адмін зв'яжеться і видасть патч на грі.",
  },
  patch_admin_notify: {
    pl: "🎖 {who} prosi o naszywkę. Zatwierdzić?",
    en: "🎖 {who} requests the patch. Approve?",
    uk: "🎖 {who} просить патч. Підтвердити?",
  },
  patch_already_handled: {
    pl: "Ta prośba została już obsłużona.",
    en: "This request has already been handled.",
    uk: "Цю заявку вже оброблено.",
  },
  patch_admin_approved: {
    pl: "✅ {who}: zatwierdzono. Po wydaniu naszywki na grze naciśnij przycisk:",
    en: "✅ {who}: approved. Once you hand the patch at a game, tap:",
    uk: "✅ {who}: підтверджено. Після видачі патча на грі натисни:",
  },
  patch_admin_handed: {
    pl: "🎖 {who}: naszywka wydana, ranga Recruit.",
    en: "🎖 {who}: patch handed, rank Recruit.",
    uk: "🎖 {who}: патч видано, ранг Recruit.",
  },
  patch_admin_rejected: { pl: "❌ {who}: odrzucono.", en: "❌ {who}: rejected.", uk: "❌ {who}: відхилено." },
  btn_approve: { pl: "✅ Zatwierdź", en: "✅ Approve", uk: "✅ Підтвердити" },
  btn_reject: { pl: "❌ Odrzuć", en: "❌ Reject", uk: "❌ Відхилити" },
  btn_handed: { pl: "🎖 Wydano na grze", en: "🎖 Handed at game", uk: "🎖 Видано на грі" },
  patch_you_approved: {
    pl: "✅ Twoja prośba o naszywkę zatwierdzona — odbierzesz ją na najbliższej grze.",
    en: "✅ Your patch request was approved — you'll get it at the next game.",
    uk: "✅ Твою заявку на патч схвалено — отримаєш його на найближчій грі.",
  },
  patch_you_rejected: {
    pl: "❌ Twoja prośba o naszywkę została odrzucona. Napisz do admina po szczegóły.",
    en: "❌ Your patch request was rejected. Message an admin for details.",
    uk: "❌ Твою заявку на патч відхилено. Напиши адміну за деталями.",
  },
  patch_you_handed: {
    pl: "🎖 Naszywka wydana! Witaj w RX Team. Ranga: Recruit. Od teraz 100% punktów. Rangi kupisz przez /rank.",
    en: "🎖 Patch handed! Welcome to RX Team. Rank: Recruit. 100% points from now on. Buy ranks via /rank.",
    uk: "🎖 Патч видано! Вітаємо в RX Team. Ранг: Recruit. Відтепер 100% балів. Ранги купуються через /rank.",
  },

  // ранги — /rank
  econ_off: {
    pl: "Ekonomia jest teraz wyłączona.",
    en: "The economy is currently disabled.",
    uk: "Економіка зараз вимкнена.",
  },
  rank_with_next: {
    pl: "🎖 Ranga: {rank}\n💰 Saldo: {balance} pkt\nNastępna: {next} — koszt {cost} pkt",
    en: "🎖 Rank: {rank}\n💰 Balance: {balance} pts\nNext: {next} — cost {cost} pts",
    uk: "🎖 Ранг: {rank}\n💰 Баланс: {balance} б.\nНаступний: {next} — ціна {cost} б.",
  },
  rank_max: {
    pl: "🎖 Ranga: {rank} — maksymalna. 💰 Saldo: {balance} pkt",
    en: "🎖 Rank: {rank} — top rank. 💰 Balance: {balance} pts",
    uk: "🎖 Ранг: {rank} — максимальний. 💰 Баланс: {balance} б.",
  },
  rank_need_patch: {
    pl: "🎖 Ranga: brak — potrzebna naszywka.\n💰 Saldo: {balance} pkt\nRangi odblokujesz po otrzymaniu naszywki: /patch",
    en: "🎖 Rank: none — patch required.\n💰 Balance: {balance} pts\nRanks unlock once you get the patch: /patch",
    uk: "🎖 Ранг: немає — потрібен патч.\n💰 Баланс: {balance} б.\nРанги відкриються після отримання патча: /patch",
  },
  btn_buy_rank: {
    pl: "⬆️ Kup: {next} ({cost})",
    en: "⬆️ Buy: {next} ({cost})",
    uk: "⬆️ Купити: {next} ({cost})",
  },
  rank_not_enough: {
    pl: "Brakuje {need} pkt do rangi {next}.",
    en: "You need {need} more pts for {next}.",
    uk: "Бракує {need} б. до рангу {next}.",
  },
  rank_bought: {
    pl: "🎉 Gratulacje! Nowa ranga: {rank}. 💰 Saldo: {balance} pkt",
    en: "🎉 Congrats! New rank: {rank}. 💰 Balance: {balance} pts",
    uk: "🎉 Вітаємо! Новий ранг: {rank}. 💰 Баланс: {balance} б.",
  },
  rank_changed: {
    pl: "Ranga lub saldo zmieniły się w międzyczasie. Spróbuj ponownie: /rank",
    en: "Your rank or balance changed meanwhile. Please try again: /rank",
    uk: "Ранг або баланс змінилися. Спробуй ще раз: /rank",
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
    pl: "Nie jesteś zapisany na żadną grę. Lista kierowców (carpool) jest dostępna dopiero po zapisaniu się na grę — zapisz się przez /games.",
    en: "You're not signed up for any game. The drivers list (carpool) is shown only after you sign up — register for a game via /games.",
    uk: "Ти не записаний на жодну гру. Список водіїв (карпул) можна побачити лише після реєстрації — спершу запишись на гру через /games.",
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
    pl: "🚗 {who} — {from} · {price} · {seats} miejsc → {contact}",
    en: "🚗 {who} — {from} · {price} · {seats} seats → {contact}",
    uk: "🚗 {who} — {from} · {price} · {seats} місць → {contact}",
  },
  drivers_line_closed: {
    pl: "🚗 {who} — {from} · {price} · (komplet)",
    en: "🚗 {who} — {from} · {price} · (full)",
    uk: "🚗 {who} — {from} · {price} · (набір закрито)",
  },
  drivers_contact_none: {
    pl: "napisz w grupie",
    en: "write in the group",
    uk: "напиши в групі",
  },
  drivers_pickups: {
    pl: "🛑 {n} punktów zbiórki",
    en: "🛑 {n} pickup points",
    uk: "🛑 {n} точок підбору",
  },
  myride_none: {
    pl: "Nie jesteś kierowcą na żadnej grze (zapis „własnym autem”).",
    en: "You're not a driver for any game (signed up as „my own ride”).",
    uk: "Ти не водій на жодній грі (реєстрація «своїм ходом»).",
  },
  myride_pick: { pl: "Wybierz grę:", en: "Pick a game:", uk: "Обери гру:" },
  myride_panel: {
    pl: "🚗 «{title}»\nSkąd: {from}\nCena: {price}\nWolne miejsca: {seats}\nStatus: {status}",
    en: "🚗 «{title}»\nFrom: {from}\nPrice: {price}\nFree seats: {seats}\nStatus: {status}",
    uk: "🚗 «{title}»\nЗвідки: {from}\nЦіна: {price}\nВільних місць: {seats}\nСтатус: {status}",
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

  // ── Carpool: точка виїзду + бронювання місць (Етап 34) ──
  btn_ride_pin: { pl: "📍 Punkt wyjazdu", en: "📍 Departure point", uk: "📍 Точка виїзду" },
  ride_ask_pin: {
    pl: "Wyślij swoją lokalizację (📎 → Lokalizacja), aby zaznaczyć, skąd jedziesz.",
    en: "Send your location (📎 → Location) to mark where you set off from.",
    uk: "Надішли свою локацію (📎 → Місцезнаходження), щоб позначити, звідки їдеш.",
  },
  ride_pin_saved: {
    pl: "📍 Zapisano punkt wyjazdu. Zobaczysz go na mapie carpool na stronie.",
    en: "📍 Departure point saved. You'll see it on the carpool map on the site.",
    uk: "📍 Точку виїзду збережено. Вона з'явиться на карпул-мапі на сайті.",
  },
  btn_request_seat: { pl: "🪑 Miejsce u {who}", en: "🪑 Seat with {who}", uk: "🪑 Місце в {who}" },
  ride_request_to_driver: {
    pl: "🚗 {who} prosi o miejsce na «{title}».",
    en: "🚗 {who} requests a seat for «{title}».",
    uk: "🚗 {who} просить місце на «{title}».",
  },
  btn_ride_accept: { pl: "✅ Przyjmij", en: "✅ Accept", uk: "✅ Прийняти" },
  btn_ride_decline: { pl: "❌ Odrzuć", en: "❌ Decline", uk: "❌ Відхилити" },
  ride_accepted_passenger: {
    pl: "✅ {who} zabiera Cię na «{title}»! Kontakt:",
    en: "✅ {who} is giving you a ride to «{title}»! Contact:",
    uk: "✅ {who} бере тебе на «{title}»! Контакт:",
  },
  ride_declined_passenger: {
    pl: "🚗 {who} nie ma już miejsca na «{title}».",
    en: "🚗 {who} has no seat for «{title}».",
    uk: "🚗 {who} не має місця на «{title}».",
  },
  ride_driver_left_passenger: {
    pl: "🚗 {who} wypisał się z «{title}» — Twoja rezerwacja anulowana.",
    en: "🚗 {who} withdrew from «{title}» — your booking is cancelled.",
    uk: "🚗 {who} знявся з «{title}» — твоє бронювання скасовано.",
  },
  ride_request_sent_passenger: {
    pl: "Wysłano prośbę do {who}.",
    en: "Request sent to {who}.",
    uk: "Запит надіслано {who}.",
  },
  ride_already_requested: {
    pl: "Już poprosiłeś tego kierowcę.",
    en: "You already asked this driver.",
    uk: "Ти вже просив цього водія.",
  },
  ride_no_seats: { pl: "Brak wolnych miejsc.", en: "No free seats.", uk: "Місць немає." },
  ride_self: { pl: "To Twoje auto 🙂", en: "That's your car 🙂", uk: "Це твоя машина 🙂" },
  ride_request_failed: {
    pl: "Nie udało się wysłać prośby.",
    en: "Couldn't send the request.",
    uk: "Не вдалося надіслати запит.",
  },
  ride_accepted_driver: {
    pl: "✅ Przyjęto. Wysłaliśmy pasażerowi Twój kontakt.",
    en: "✅ Accepted. We sent the passenger your contact.",
    uk: "✅ Прийнято. Пасажиру надіслано твій контакт.",
  },
  ride_declined_driver: { pl: "Odrzucono.", en: "Declined.", uk: "Відхилено." },
  ride_decided_already: {
    pl: "Ta prośba została już rozpatrzona.",
    en: "This request was already handled.",
    uk: "Цей запит уже опрацьовано.",
  },
  // Реєстрація водія: ціна + пін (Етап 35)
  reg_price_q: {
    pl: "Ile kosztuje miejsce (zł)? Wpisz liczbę.",
    en: "How much per seat (zł)? Enter a number.",
    uk: "Скільки коштує місце (zł)? Введи число.",
  },
  reg_price_bad: {
    pl: "Podaj cenę liczbą (0–1000).",
    en: "Enter the price as a number (0–1000).",
    uk: "Введи ціну числом (0–1000).",
  },
  reg_pin_q: {
    pl: "Wyślij lokalizację punktu wyjazdu (📎 → Lokalizacja). Każda następna lokacja to przystanek po drodze. „Gotowe”, gdy skończysz.",
    en: "Send your departure location (📎 → Location). Each next location is a stop along the way. Tap “Done” when finished.",
    uk: "Надішли локацію точки виїзду (📎 → Місцезнаходження). Кожна наступна локація — зупинка по дорозі. «Готово», коли все.",
  },
  btn_reg_pin_skip: { pl: "⏭ Później", en: "⏭ Later", uk: "⏭ Пізніше" },
  btn_reg_done: { pl: "✅ Gotowe", en: "✅ Done", uk: "✅ Готово" },
  reg_pin_departure_saved: {
    pl: "📍 Punkt wyjazdu zapisany. Wyślij kolejną lokację — to będzie przystanek, albo „Gotowe”.",
    en: "📍 Departure saved. Send another location for a stop along the way, or tap “Done”.",
    uk: "📍 Точку виїзду збережено. Надішли наступну локацію — це буде зупинка, або «Готово».",
  },
  reg_pin_stop_added: {
    pl: "🛑 Przystanek {n} dodany. Wyślij kolejną lokację lub „Gotowe”.",
    en: "🛑 Stop {n} added. Send another location or tap “Done”.",
    uk: "🛑 Зупинку {n} додано. Ще локація або «Готово».",
  },
  reg_pin_max: {
    pl: "Maksymalnie 4 przystanki. Naciśnij „Gotowe”.",
    en: "Max 4 stops. Tap “Done”.",
    uk: "Максимум 4 зупинки. Тисни «Готово».",
  },
  ride_seeker_none: {
    pl: "Na razie brak aktywnych kierowców na tę grę. Zajrzyj później — napiszemy, gdy ktoś się zgłosi.",
    en: "No active drivers for this game yet. Check back later — we'll ping you when one shows up.",
    uk: "Поки активних водіїв на цю гру нема. Зайди пізніше — ми напишемо, коли хтось зголоситься.",
  },
  ride_new_driver: {
    pl: "🚗 Na grę «{title}» zgłosił się kierowca! Sprawdź carpool — może Cię podwiezie.",
    en: "🚗 A driver signed up for «{title}»! Check carpool — maybe you'll get a ride.",
    uk: "🚗 На гру «{title}» зголосився водій! Перевір карпул — можливо, тебе підвезуть.",
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
    pl: "🖼 Ten temat (RX Team) jest tylko na zdjęcia, wideo i pliki — bez dyskusji. Zasady:\n✅ Zdjęcie z opisem — OK\n✅ Zdjęcie/plik jako dokument — OK\n✅ Wideo — OK\n❌ Sam tekst — usuwany\n\nTwoja wiadomość została usunięta. Chcesz to omówić? Pisz w temacie «Zalew» (flood).",
    en: "🖼 This topic (RX Team) is for photos, videos and files only — no chatter. Rules:\n✅ Photo with a caption — OK\n✅ Photo/file as a document — OK\n✅ Video — OK\n❌ Plain text — removed\n\nYour message was deleted. Want to discuss it? Use the «Zalew» (flood) topic.",
    uk: "🖼 Ця гілка (RX Team) — лише для фото, відео й файлів, без обговорень. Правила:\n✅ Фото з описом — ОК\n✅ Фото/файл документом — ОК\n✅ Відео — ОК\n❌ Самий текст — видаляється\n\nТвоє повідомлення видалено. Хочеш це обговорити? Пиши в гілці «Zalew» (флуд).",
  },
  media_guard_warn2: {
    pl: "⚠️ Drugie (ostatnie) ostrzeżenie. Przypominam zasady tego tematu (RX Team) — tylko zdjęcia, wideo i pliki, bez dyskusji:\n✅ Zdjęcie z opisem — OK\n✅ Zdjęcie/plik jako dokument — OK\n✅ Wideo — OK\n❌ Sam tekst — usuwany\n\nDyskusje pisz w temacie «Zalew» (flood). Następna wiadomość tekstowa tutaj = wyciszenie w grupie na 15 minut.",
    en: "⚠️ Second (final) warning. A reminder of this topic's rules (RX Team) — photos, videos and files only, no chatter:\n✅ Photo with a caption — OK\n✅ Photo/file as a document — OK\n✅ Video — OK\n❌ Plain text — removed\n\nTake discussions to the «Zalew» (flood) topic. Your next text message here = a 15-minute mute in the group.",
    uk: "⚠️ Друге (останнє) попередження. Нагадую правила цієї гілки (RX Team) — лише фото, відео й файли, без обговорень:\n✅ Фото з описом — ОК\n✅ Фото/файл документом — ОК\n✅ Відео — ОК\n❌ Самий текст — видаляється\n\nОбговорення пиши в гілці «Zalew» (флуд). Наступне текстове повідомлення тут = мут у групі на 15 хвилин.",
  },
  media_guard_muted: {
    pl: "🔇 Zostałeś wyciszony w grupie RX Team na 15 minut. Powód: powtarzające się wiadomości tekstowe w temacie tylko-media (zdjęcia/wideo/pliki). Dyskusje pisz w temacie «Zalew» (flood). Za 15 minut znów napiszesz w innych tematach.",
    en: "🔇 You've been muted in the RX Team group for 15 minutes. Reason: repeated text messages in the media-only topic (photos/videos/files). Take discussions to the «Zalew» (flood) topic. In 15 minutes you'll be able to post in other topics again.",
    uk: "🔇 Тебе заглушено в групі RX Team на 15 хвилин. Причина: повторні текстові повідомлення в гілці «тільки медіа» (фото/відео/файли). Обговорення пиши в гілці «Zalew» (флуд). Через 15 хвилин знову зможеш писати в інших гілках.",
  },

  // ── Барахолка / Marketplace (Етап 28) ──
  // Інфо/згода при першому повідомленні в гілку. {flood} — куди йдуть обговорення, {hint} — як отримати патч.
  mp_info: {
    pl: "🛒 To wątek „Giełda” drużyny RX Team. Możesz wystawić swój sprzęt także na stronie rxteam.pl — dodaj w opisie zdjęcia tag #promo. Uwaga: na stronie pojawi się link do Twojego profilu Telegram, a korzystając z tej funkcji wyrażasz na to zgodę. Publikacja na stronie wymaga naszywki. {hint}\n\nDyskusje: {flood}",
    en: "🛒 This is the RX Team “Marketplace” topic. You can also list your gear on rxteam.pl — add the #promo tag to the photo's caption. Note: a link to your Telegram profile will appear on the site, and by using this feature you consent to that. Publishing on the site requires a patch. {hint}\n\nDiscussions: {flood}",
    uk: "🛒 Це гілка «Барахолка» команди RX Team. Своє спорядження можна виставити й на сайті rxteam.pl — додай у підпис до фото тег #promo. Увага: на сайті з'явиться посилання на твій профіль Telegram, і користуючись цією функцією ти з цим погоджуєшся. Публікація на сайті потребує патча. {hint}\n\nОбговорення: {flood}",
  },
  mp_guard_warn: {
    pl: "🛒 Wątek „Giełda” (RX Team) jest tylko na ZDJĘCIA Z OPISEM. Twoja wiadomość została usunięta. Dyskusje i pytania pisz w prywatnej wiadomości do sprzedawcy albo w wątku «Zalew» (flood).",
    en: "🛒 The “Marketplace” topic (RX Team) is for PHOTOS WITH A DESCRIPTION only. Your message was deleted. Take discussions and questions to a private chat with the seller or to the «Zalew» (flood) topic.",
    uk: "🛒 Гілка «Барахолка» (RX Team) — лише для ФОТО З ОПИСОМ. Твоє повідомлення видалено. Обговорення й питання — у приват продавцю або в гілку «Zalew» (флуд).",
  },
  mp_guard_warn2: {
    pl: "⚠️ Drugie (ostatnie) ostrzeżenie. Wątek „Giełda” — tylko zdjęcia z opisem. Następna obca wiadomość tutaj = wyciszenie w grupie na 15 minut. Dyskusje pisz w wątku «Zalew» (flood).",
    en: "⚠️ Second (final) warning. The “Marketplace” topic is for photos with a description only. Your next stray message here = a 15-minute mute in the group. Take discussions to the «Zalew» (flood) topic.",
    uk: "⚠️ Друге (останнє) попередження. Гілка «Барахолка» — лише фото з описом. Наступне стороннє повідомлення тут = мут у групі на 15 хвилин. Обговорення — у гілці «Zalew» (флуд).",
  },
  mp_guard_muted: {
    pl: "🔇 Zostałeś wyciszony w grupie RX Team na 15 minut za powtarzające się obce wiadomości w wątku „Giełda”. Dyskusje pisz w wątku «Zalew» (flood).",
    en: "🔇 You've been muted in the RX Team group for 15 minutes for repeated stray messages in the “Marketplace” topic. Take discussions to the «Zalew» (flood) topic.",
    uk: "🔇 Тебе заглушено в групі RX Team на 15 хвилин за повторні сторонні повідомлення в гілці «Барахолка». Обговорення пиши в гілці «Zalew» (флуд).",
  },
  mp_need_caption: {
    pl: "🛒 Zdjęcie bez opisu zostało usunięte. W wątku „Giełda” każde zdjęcie musi mieć opis. Dodaj opis (a tag #promo, jeśli chcesz, by trafiło na stronę).",
    en: "🛒 A photo without a description was removed. In the “Marketplace” topic every photo must have a description. Add a caption (and the #promo tag if you want it on the site).",
    uk: "🛒 Фото без опису видалено. У гілці «Барахолка» кожне фото мусить мати опис. Додай опис (і тег #promo, якщо хочеш, щоб воно потрапило на сайт).",
  },
  mp_patch_required: {
    pl: "🛡 Aby opublikować ogłoszenie na stronie, potrzebna jest naszywka. Twoje zdjęcie zostaje w wątku, ale nie trafi na stronę. {hint}",
    en: "🛡 Publishing a listing on the site requires a patch. Your photo stays in the topic but won't appear on the site. {hint}",
    uk: "🛡 Щоб опублікувати оголошення на сайті, потрібен патч. Твоє фото лишається в гілці, але на сайт не потрапить. {hint}",
  },
  mp_deleted_ok: {
    pl: "🗑 Twoje ogłoszenie zostało zdjęte ze strony.",
    en: "🗑 Your listing has been removed from the site.",
    uk: "🗑 Твоє оголошення знято з сайту.",
  },
  mp_delete_not_found: {
    pl: "🤔 Nie znalazłem Twojego ogłoszenia. Odpowiedz /delete na swoje zdjęcie (lub prześlij je ponownie do tematu i odpowiedz /delete).",
    en: "🤔 Couldn't find your listing. Reply /delete to your photo (or forward it back into the topic and reply /delete).",
    uk: "🤔 Не знайшов твого оголошення. Відповідай /delete на своє фото (або перешли його в гілку й відповідай /delete).",
  },
  mp_delete_not_yours: {
    pl: "⛔ To nie jest Twoje ogłoszenie.",
    en: "⛔ This isn't your listing.",
    uk: "⛔ Це не твоє оголошення.",
  },
  mp_submitted: {
    pl: "📨 Twoje ogłoszenie zostało wysłane do moderacji. Po zatwierdzeniu pojawi się na stronie (Giełda).",
    en: "📨 Your listing has been sent for moderation. Once approved it will appear on the site (Marketplace).",
    uk: "📨 Твоє оголошення надіслано на модерацію. Після підтвердження воно з'явиться на сайті (Барахолка).",
  },
  mp_you_approved: {
    pl: "✅ Twoje ogłoszenie zostało opublikowane na stronie (Giełda).",
    en: "✅ Your listing has been published on the site (Marketplace).",
    uk: "✅ Твоє оголошення опубліковано на сайті (Барахолка).",
  },
  mp_you_rejected: {
    pl: "❌ Twoje ogłoszenie zostało odrzucone przez moderatora.",
    en: "❌ Your listing was rejected by a moderator.",
    uk: "❌ Твоє оголошення відхилив модератор.",
  },
  mp_card_approved: { pl: "✅ Opublikowano — {who}", en: "✅ Published — {who}", uk: "✅ Опубліковано — {who}" },
  mp_card_rejected: { pl: "❌ Odrzucono — {who}", en: "❌ Rejected — {who}", uk: "❌ Відхилено — {who}" },
  mp_card_done: { pl: "Już obsłużone.", en: "Already handled.", uk: "Вже оброблено." },
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
