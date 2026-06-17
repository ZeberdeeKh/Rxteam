-- RX Team — Етап 24 (один відкритий запит на патч на гравця: партійний UNIQUE-індекс).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap23.sql. Деплой коду — разом із міграцією.
--
-- Захист від гонки подвійного сабміту кнопки «Подати запит на патч» у кабінеті:
-- застосунковий дедуп (SELECT перед INSERT) не атомарний. Партійний UNIQUE гарантує,
-- що в гравця не буде двох відкритих запитів. Після rejected/handed новий запит дозволено.
-- Перед створенням індексу прибираємо можливі наявні дублікати відкритих запитів
-- (лишаємо найновіший за created_at), інакше CREATE UNIQUE INDEX впаде.

delete from patch_requests pr
 using patch_requests keep
 where pr.player_id = keep.player_id
   and pr.status in ('requested', 'approved')
   and keep.status in ('requested', 'approved')
   and (pr.created_at < keep.created_at
        or (pr.created_at = keep.created_at and pr.id < keep.id));

create unique index if not exists uniq_patch_requests_player_open
  on patch_requests (player_id)
  where status in ('requested', 'approved');
