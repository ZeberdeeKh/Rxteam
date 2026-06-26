-- RX Team — Етап 39 (ачивки за активність у чаті: 100 / 1000 / 5000 / 10000 повідомлень).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap38.sql. Ідемпотентно.
--
-- Тема назв — «Флуд»: Flood Rookie → Flooder → Spam Master → Flood Lord.
-- Рівні (tier): easy / mid / hard / legendary → бали з наявних settings pts_ach_* (5/10/20/40).
-- Лічильник players.messages_sent інкрементиться в боті на КОЖНЕ повідомлення в головній групі
-- (announce_chat_id, усі топіки) через RPC bump_messages_sent. Лік починається з нуля (історії нема).
-- Видача ачивок — авто (kind='auto') у lib/economy.ts → grantMessageAchievements.

-- (a) лічильник повідомлень на гравці
alter table players add column if not exists messages_sent int not null default 0;

-- (b) атомарний інкремент + дані для видачі за один round-trip (lib/bot.ts → supabase.rpc)
create or replace function bump_messages_sent(p_tg_user_id bigint)
returns table(id bigint, messages_sent int, has_patch boolean) as $$
  update players
     set messages_sent = messages_sent + 1
   where tg_user_id = p_tg_user_id
  returning players.id, players.messages_sent, players.has_patch;
$$ language sql;

-- (c) засів 4 ачивок (enabled=true за замовч.; колонка tier — вільний text)
insert into achievements (code, title_pl, title_en, title_uk, tier) values
  ('msg_100',   'Młody floodziarz', 'Flood Rookie', 'Юний флудер',   'easy'),
  ('msg_1000',  'Floodziarz',       'Flooder',      'Флудер',        'mid'),
  ('msg_5000',  'Mistrz floodu',    'Spam Master',  'Майстер флуду', 'hard'),
  ('msg_10000', 'Władca floodu',    'Flood Lord',   'Володар флуду', 'legendary')
on conflict (code) do nothing;

update achievements set kind = 'auto'
 where code in ('msg_100', 'msg_1000', 'msg_5000', 'msg_10000');

update achievements set description_pl='Za 100 wiadomości na czacie grupy.',   description_en='Sent 100 messages in the group chat.',   description_uk='За 100 повідомлень у груповому чаті.'   where code='msg_100';
update achievements set description_pl='Za 1000 wiadomości na czacie grupy.',  description_en='Sent 1000 messages in the group chat.',  description_uk='За 1000 повідомлень у груповому чаті.'  where code='msg_1000';
update achievements set description_pl='Za 5000 wiadomości na czacie grupy.',  description_en='Sent 5000 messages in the group chat.',  description_uk='За 5000 повідомлень у груповому чаті.'  where code='msg_5000';
update achievements set description_pl='Za 10000 wiadomości na czacie grupy.', description_en='Sent 10000 messages in the group chat.', description_uk='За 10000 повідомлень у груповому чаті.' where code='msg_10000';
