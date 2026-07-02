// Публічна картка гравця (Player Card) — серверне ядро ЗБОРУ ДАНИХ (bot-agnostic).
// Тільки дані: рендер у PNG (SVG+resvg) і публічна сторінка /u/<callsign> — окремо.
// Перевикористовуємо наявні джерела: профіль (players), надійність (getReliability),
// ачивки (getPlayerAchievements), місце в топі рахуємо тими ж фільтрами, що й getRanking.
import { supabase } from "./supabase";
import { getReliability } from "./economy";
import { getPlayerAchievements, type PlayerAch } from "./site-data";

export type PlayerCardData = {
  id: number;
  callsign: string;
  rank: string | null; // ранг показуємо лише за наявності патча (як у /profile); інакше null
  hasPatch: boolean;
  gamesPlayed: number;
  pointsEarned: number;
  reliabilityPct: number | null; // null — ще нема даних явок/неявок
  place: number | null; // місце в публічному рейтингу; null для адміна/майстра (їх у рейтингу нема)
  registeredAt: string | null; // дата реєстрації (created_at) — «зареєстрований з»
  patchAt: string | null; // дата отримання патча (patch_at); null якщо патча нема / легасі без дати
  achievements: PlayerAch[]; // усі здобуті (найсвіжіші перші); скільки показати — вирішує презентація
};

const PLAYER_COLS =
  "id, callsign, rank, has_patch, games_played, points_earned, is_admin, is_master, created_at, patch_at";

// Місце в публічному рейтингу: ті самі фільтри, що getRanking (не адмін/майстер) —
// скільки гравців мають БІЛЬШЕ «зароблено всього», + 1. head:true → лічимо без вибірки рядків.
export async function getPlayerPlace(pointsEarned: number): Promise<number> {
  const { count } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", false)
    .eq("is_master", false)
    .gt("points_earned", pointsEarned);
  return (count ?? 0) + 1;
}

async function buildCardData(p: any): Promise<PlayerCardData> {
  const [rel, achs] = await Promise.all([getReliability(p.id), getPlayerAchievements(p.id)]);
  const isPublic = !p.is_admin && !p.is_master; // адмінів/майстра в публічному топі не рахуємо
  const place = isPublic ? await getPlayerPlace(p.points_earned ?? 0) : null;
  return {
    id: p.id,
    callsign: p.callsign,
    rank: p.has_patch ? (p.rank ?? "Recruit") : null,
    hasPatch: !!p.has_patch,
    gamesPlayed: p.games_played ?? 0,
    pointsEarned: p.points_earned ?? 0,
    reliabilityPct: rel.pct,
    place,
    registeredAt: p.created_at ?? null,
    patchAt: p.has_patch ? (p.patch_at ?? null) : null,
    achievements: achs,
  };
}

// За позивним — для публічної сторінки /u/<callsign>. Картка лише в гравців із позивним.
// (Унікальність позивного поки не гарантована — беремо перший збіг; закриємо на етапі URL-схеми.)
export async function getPlayerCardByCallsign(callsign: string): Promise<PlayerCardData | null> {
  const { data } = await supabase
    .from("players")
    .select(PLAYER_COLS)
    .ilike("callsign", callsign)
    .limit(1)
    .maybeSingle();
  if (!data?.callsign) return null;
  return buildCardData(data);
}

// За id — для бота (/profile) і кабінету. Картка лише якщо гравець заповнив позивний.
export async function getPlayerCardById(id: number): Promise<PlayerCardData | null> {
  const { data } = await supabase.from("players").select(PLAYER_COLS).eq("id", id).maybeSingle();
  if (!data?.callsign) return null;
  return buildCardData(data);
}
