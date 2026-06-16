-- RX Team — Етап 21 (трилінгва-опис ачівки description_pl/en/uk + вид kind: auto|manual; бекфіл сід-кодів у auto).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap20.sql. Деплой коду — разом із міграцією.

alter table achievements
  add column if not exists description_pl text,
  add column if not exists description_en text,
  add column if not exists description_uk text,
  add column if not exists kind text not null default 'manual';

-- Бекфіл: усі сід-ачівки — це auto (складна код-логіка тригера); створені адміном лишаються manual.
update achievements set kind = 'auto'
 where code in ('first_contact','deploy_10','deploy_25','deploy_50','recruiter','dawn_patrol','iron_discipline');

-- Описи тригерів auto-ачівок (трилінгва). Для manual-ачівок опис заповнює адмін в адмінці.
update achievements set
  description_en = 'Granted automatically on your first game check-in.',
  description_pl = 'Przyznawane automatycznie przy pierwszym zameldowaniu na grze.',
  description_uk = 'Видається автоматично за перший чек-ін на грі.'
 where code = 'first_contact';

update achievements set
  description_en = 'Granted automatically on your 10th game check-in.',
  description_pl = 'Przyznawane automatycznie przy 10. zameldowaniu na grze.',
  description_uk = 'Видається автоматично за 10-й чек-ін на грі.'
 where code = 'deploy_10';

update achievements set
  description_en = 'Granted automatically on your 25th game check-in.',
  description_pl = 'Przyznawane automatycznie przy 25. zameldowaniu na grze.',
  description_uk = 'Видається автоматично за 25-й чек-ін на грі.'
 where code = 'deploy_25';

update achievements set
  description_en = 'Granted automatically on your 50th game check-in.',
  description_pl = 'Przyznawane automatycznie przy 50. zameldowaniu na grze.',
  description_uk = 'Видається автоматично за 50-й чек-ін на грі.'
 where code = 'deploy_50';

update achievements set
  description_en = 'Granted automatically when a player you invited completes their first check-in.',
  description_pl = 'Przyznawane automatycznie, gdy zaproszony przez Ciebie gracz zamelduje się pierwszy raz.',
  description_uk = 'Видається автоматично, коли запрошений тобою гравець уперше робить чек-ін.'
 where code = 'recruiter';

update achievements set
  description_en = 'Granted automatically for an early check-in (0–10 min after the window opens).',
  description_pl = 'Przyznawane automatycznie za wczesne zameldowanie (0–10 min po otwarciu okna).',
  description_uk = 'Видається автоматично за ранній чек-ін (0–10 хв після відкриття вікна).'
 where code = 'dawn_patrol';

update achievements set
  description_en = 'Granted automatically during the seasonal lottery to players with zero no-shows in the quarter.',
  description_pl = 'Przyznawane automatycznie podczas sezonowej loterii graczom bez nieobecności w kwartale.',
  description_uk = 'Видається автоматично під час сезонної лотереї гравцям без жодної неявки за квартал.'
 where code = 'iron_discipline';
