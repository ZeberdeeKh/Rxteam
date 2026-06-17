-- Етап 25: дата видачі нашивки (patch_at) + бэкфилл з історії запитів.
-- Кабінет показує не просто «є», а з якої дати отримано патч.

alter table players add column if not exists patch_at timestamptz;

-- Бэкфилл: для гравців із нашивкою беремо дату останнього «handed» запиту.
update players p
set patch_at = pr.decided_at
from (
  select distinct on (player_id) player_id, decided_at
  from patch_requests
  where status = 'handed' and decided_at is not null
  order by player_id, decided_at desc
) pr
where pr.player_id = p.id
  and p.has_patch = true
  and p.patch_at is null;
