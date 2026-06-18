-- RX Team — Етап 30 (FAQ як окремий модуль: таблиця faq_items + адмінка /admin/faq).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap29.sql.
--
-- Раніше текст правил/FAQ зберігався одним блоком у settings.faq_<lang> і дублювався
-- хардкодом на сайті. Тепер САЙТ показує структурований FAQ — список пар «питання +
-- відповідь» (тримовно UA/PL/EN), якими керують в адмінці (створити / видалити /
-- сховати / впорядкувати). Бот /rules поки лишається на settings.faq_<lang> (рішення
-- власника: модуль годує лише сайт). Поки faq_items порожня — сайт відкочується на
-- старий текст settings.faq_<lang> (graceful fallback у RulesFaq), тож порядок
-- «задеплоїти код → виконати цей SQL» безпечний у будь-якій послідовності.

create table if not exists faq_items (
  id          bigint generated always as identity primary key,
  question_uk text    not null,
  question_pl text    not null default '',
  question_en text    not null default '',
  answer_uk   text    not null,
  answer_pl   text    not null default '',
  answer_en   text    not null default '',
  sort_order  int     not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists faq_items_order_idx on faq_items (active, sort_order, id);

-- Сід: стартові питання з нинішніх правил (UA+PL; EN лишаємо порожнім → сайт
-- відкотиться на PL для EN-відвідувачів). Ідемпотентно по question_uk: вставляє лише
-- ті рядки, яких ще нема, тож працює і на чистій базі, і при повторному запуску.
insert into faq_items (question_uk, question_pl, answer_uk, answer_pl, sort_order)
select v.q_uk, v.q_pl, v.a_uk, v.a_pl, v.ord
from (values
  ('Чи обов''язковий захист очей?',
   'Czy ochrona oczu jest obowiązkowa?',
   'Так — захист очей ОБОВ''ЯЗКОВИЙ протягом усієї гри.',
   'Tak — ochrona oczu jest OBOWIĄZKOWA przez całą grę.', 10),
  ('Що робити, коли мене «поранено»?',
   'Co robić, gdy zostanę „trafiony”?',
   'Піднімаєш руку / червону ганчірку і йдеш у респ. Чесна гра — зараховуй влучання.',
   'Podnosisz rękę / czerwoną szmatkę i idziesz do respawnu. Fair play — zaliczaj trafienia.', 20),
  ('Що взяти на гру?',
   'Co zabrać na grę?',
   'Привід + акумулятор/газ, кулі, захист очей/обличчя, одяг по погоді, воду.',
   'Replikę + akumulator/gaz, kulki, ochronę oczu/twarzy, ubranie na pogodę, wodę.', 30),
  ('Немає спорядження — що робити?',
   'Nie mam sprzętu — co robić?',
   'Є оренда — познач при реєстрації в боті.',
   'Jest wypożyczalnia — zaznacz przy rejestracji w bocie.', 40),
  ('Які правила гілок у Telegram?',
   'Jakie są zasady wątków na Telegramie?',
   E'💬 Флуд — вільний чат не за темою, без спаму й реклами.\n🛒 Куплю/Продам (Барахолка) — фото з описом; комерційні оголошення — після узгодження з адміном.\n📣 Анонси ігор — тільки бот.\n📷 Фото/відео з ігор — тільки медіа, без тексту.',
   E'💬 Zalew — luźny czat off-topic, bez spamu i reklam.\n🛒 Kupię/Sprzedam (Giełda) — zdjęcie z opisem; ogłoszenia komercyjne — po uzgodnieniu z adminem.\n📣 Zapowiedzi gier — tylko bot.\n📷 Zdjęcia/wideo z gier — tylko media, bez tekstu.', 50)
) as v(q_uk, q_pl, a_uk, a_pl, ord)
where not exists (select 1 from faq_items f where f.question_uk = v.q_uk);
