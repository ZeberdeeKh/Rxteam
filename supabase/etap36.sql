-- RX Team — Етап 36 (карпул: точки підбору + маршрут).
-- Виконати в Supabase → SQL Editor ПІСЛЯ etap35.sql. Ідемпотентно.
--
-- До 4 точок, де водій може когось підібрати по дорозі. JSON-масив [{lat,lng}, ...] на рядку
-- реєстрації водія (1:1, як from_lat/from_lng). Мапа малює маршрут: виїзд → точки підбору →
-- полігон. Обмеження «≤4» — у коді (savePickups / лист точок). null = без точок підбору.
alter table registrations add column if not exists pickups jsonb;
