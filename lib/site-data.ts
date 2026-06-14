// Спільні серверні читання для сайту (лендінг, /games, /ranking).
// Усе через service-key (lib/supabase.ts) — RLS off, лише сервер. Жодних next/headers тут.
import { supabase } from "./supabase";

export type SiteLocation = {
  name: string | null;
  map_url: string | null;
  lat: number | null;
  lng: number | null;
};

export type SiteGame = {
  id: number;
  title: string | null;
  start_at: string;
  gather_at: string | null;
  capacity: number | null;
  status: string;
  location: SiteLocation | null;
  count: number; // записаних (status='registered')
};

const GAME_COLS =
  "id, title, start_at, gather_at, capacity, status, locations(name, map_url, lat, lng)";

// Нормалізує вкладену локацію (Supabase повертає масив/обʼєкт залежно від звʼязку).
function normLoc(row: any): SiteLocation | null {
  const l = Array.isArray(row?.locations) ? row.locations[0] : row?.locations;
  if (!l) return null;
  return { name: l.name ?? null, map_url: l.map_url ?? null, lat: l.lat ?? null, lng: l.lng ?? null };
}

// Кількість записаних для набору ігор — одним запитом (без N+1).
async function countsFor(gameIds: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (!gameIds.length) return map;
  const { data } = await supabase
    .from("registrations")
    .select("game_id")
    .in("game_id", gameIds)
    .eq("status", "registered");
  for (const r of data ?? []) map.set(r.game_id as number, (map.get(r.game_id as number) ?? 0) + 1);
  return map;
}

function toSiteGame(row: any, count: number): SiteGame {
  return {
    id: row.id,
    title: row.title ?? null,
    start_at: row.start_at,
    gather_at: row.gather_at ?? null,
    capacity: row.capacity ?? null,
    status: row.status,
    location: normLoc(row),
    count,
  };
}

// Найближча майбутня анонсована гра (start_at > now). null — якщо немає.
export async function getNextGame(): Promise<SiteGame | null> {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("games")
    .select(GAME_COLS)
    .eq("status", "announced")
    .gt("start_at", nowIso)
    .order("start_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const counts = await countsFor([data.id as number]);
  return toSiteGame(data, counts.get(data.id as number) ?? 0);
}

// Майбутні анонсовані ігри (start_at >= now), за зростанням часу.
export async function getUpcomingGames(limit = 20): Promise<SiteGame[]> {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("games")
    .select(GAME_COLS)
    .eq("status", "announced")
    .gte("start_at", nowIso)
    .order("start_at", { ascending: true })
    .limit(limit);
  const rows = data ?? [];
  const counts = await countsFor(rows.map((r) => r.id as number));
  return rows.map((r) => toSiteGame(r, counts.get(r.id as number) ?? 0));
}

// Минулі ігри (start_at < now), за спаданням часу.
export async function getPastGames(limit = 12): Promise<SiteGame[]> {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("games")
    .select(GAME_COLS)
    .lt("start_at", nowIso)
    .neq("status", "cancelled")
    .order("start_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const counts = await countsFor(rows.map((r) => r.id as number));
  return rows.map((r) => toSiteGame(r, counts.get(r.id as number) ?? 0));
}

export type RankingRow = {
  id: number;
  callsign: string | null;
  name: string | null;
  rank: string | null;
  has_patch: boolean;
  points_earned: number;
  games_played: number;
};

// Публічний рейтинг за «зароблено всього» (як бот /top). Топ-N.
export async function getRanking(limit = 10): Promise<RankingRow[]> {
  const { data } = await supabase
    .from("players")
    .select("id, callsign, name, rank, has_patch, points_earned, games_played")
    .or("points_earned.gt.0,games_played.gt.0")
    .order("points_earned", { ascending: false })
    .order("games_played", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);
  return (data ?? []) as RankingRow[];
}

// ─────────────────────────────── Кабінет (6.2) ───────────────────────────────

export type CabinetGame = SiteGame & {
  regStatus: "registered" | "cancelled" | "no_show" | null;
  checkedIn: boolean;
  canRegister: boolean;
  canUnregister: boolean;
  checkinOpen: boolean;
};

// Ігри для кабінету: усі анонсовані, чиє вікно чек-іну ще не закрите (checkin_to >= now),
// з прапорцями стану конкретного гравця (рег/чек-ін/можна записатись/відписатись/чек-інитись).
export async function getCabinetGames(playerId: number): Promise<CabinetGame[]> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const { data } = await supabase
    .from("games")
    .select(`${GAME_COLS}, reg_closes_at, cancel_deadline, checkin_from, checkin_to`)
    .eq("status", "announced")
    .gte("checkin_to", nowIso)
    .order("start_at", { ascending: true })
    .limit(30);
  const rows = data ?? [];
  if (!rows.length) return [];

  const ids = rows.map((r) => r.id as number);
  const [counts, regsRes, checksRes] = await Promise.all([
    countsFor(ids),
    supabase.from("registrations").select("game_id, status").eq("player_id", playerId).in("game_id", ids),
    supabase.from("checkins").select("game_id").eq("player_id", playerId).in("game_id", ids),
  ]);
  const regMap = new Map<number, string>();
  for (const r of regsRes.data ?? []) regMap.set(r.game_id as number, r.status as string);
  const checkedSet = new Set((checksRes.data ?? []).map((c) => c.game_id as number));

  const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : null);

  return rows.map((r) => {
    const count = counts.get(r.id as number) ?? 0;
    const regStatus = (regMap.get(r.id as number) ?? null) as CabinetGame["regStatus"];
    const checkedIn = checkedSet.has(r.id as number);
    const regCloses = ms((r as any).reg_closes_at);
    const cancelDl = ms((r as any).cancel_deadline);
    const cFrom = ms((r as any).checkin_from);
    const cTo = ms((r as any).checkin_to);
    const capacityFull = r.capacity != null && count >= r.capacity;

    return {
      ...toSiteGame(r, count),
      regStatus,
      checkedIn,
      canRegister:
        regStatus !== "registered" && (regCloses === null || regCloses > now) && !capacityFull,
      canUnregister: regStatus === "registered" && (cancelDl === null || cancelDl > now),
      checkinOpen:
        !checkedIn &&
        (regStatus === "registered" || regStatus === "no_show") &&
        cFrom !== null &&
        cTo !== null &&
        cFrom <= now &&
        now <= cTo,
    };
  });
}

export type PointLogRow = {
  delta: number;
  reason: string;
  meta: string | null;
  game_id: number | null;
  created_at: string;
};

// Останні рухи балів гравця (журнал point_log).
export async function getPointLog(playerId: number, limit = 25): Promise<PointLogRow[]> {
  const { data } = await supabase
    .from("point_log")
    .select("delta, reason, meta, game_id, created_at")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as PointLogRow[];
}

export type PlayerAch = {
  code: string;
  created_at: string;
  title_pl: string | null;
  title_en: string | null;
  title_uk: string | null;
};

// Здобуті ачівки гравця (з назвами).
export async function getPlayerAchievements(playerId: number): Promise<PlayerAch[]> {
  const { data } = await supabase
    .from("player_achievements")
    .select("code, created_at, achievements(title_pl, title_en, title_uk)")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r: any) => {
    const a = Array.isArray(r.achievements) ? r.achievements[0] : r.achievements;
    return {
      code: r.code,
      created_at: r.created_at,
      title_pl: a?.title_pl ?? null,
      title_en: a?.title_en ?? null,
      title_uk: a?.title_uk ?? null,
    };
  });
}
