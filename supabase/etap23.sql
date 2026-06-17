-- RX Team — Етап 23 (трилінгва-назви auto-ачівок title_pl/en/uk; manual-ачівки не чіпаємо).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap22.sql. Деплой коду — разом із міграцією.
--
-- Сід etap3.sql заповнив усі три title_* однаковим англ. рядком — на сайті pl/uk бачили англ.
-- Тут даємо auto-ачівкам справжній переклад. Захист `and kind = 'auto'`: ручні (створені
-- адміном) лишаються як є. title_en переписуємо тим самим значенням — повний трилінгва-запис.

update achievements set
  title_en = 'First Contact',
  title_pl = 'Pierwszy kontakt',
  title_uk = 'Перший контакт'
 where code = 'first_contact' and kind = 'auto';

update achievements set
  title_en = '10 Deployments',
  title_pl = '10 rozmieszczeń',
  title_uk = '10 розгортань'
 where code = 'deploy_10' and kind = 'auto';

update achievements set
  title_en = '25 Deployments',
  title_pl = '25 rozmieszczeń',
  title_uk = '25 розгортань'
 where code = 'deploy_25' and kind = 'auto';

update achievements set
  title_en = '50 Deployments',
  title_pl = '50 rozmieszczeń',
  title_uk = '50 розгортань'
 where code = 'deploy_50' and kind = 'auto';

update achievements set
  title_en = 'Recruiter',
  title_pl = 'Werbownik',
  title_uk = 'Вербувальник'
 where code = 'recruiter' and kind = 'auto';

update achievements set
  title_en = 'Dawn Patrol',
  title_pl = 'Patrol o świcie',
  title_uk = 'Світанковий патруль'
 where code = 'dawn_patrol' and kind = 'auto';

update achievements set
  title_en = 'Iron Discipline',
  title_pl = 'Żelazna dyscyplina',
  title_uk = 'Залізна дисципліна'
 where code = 'iron_discipline' and kind = 'auto';
