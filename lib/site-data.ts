// Спільні серверні читання для сайту (лендінг, /games).
// Усе через service-key (lib/supabase.ts) — RLS off, лише сервер. Жодних next/headers тут.
import { supabase } from "./supabase";
import { buildAnnouncement, type LocationLimits } from "./games";
import { getAllSettings } from "./settings";

// ── FAQ (Етап 30) — активні питання для блоку «Правила та FAQ» на сайті. ──
// Повертає [] і коли таблиці ще нема (міграція не виконана) — тоді RulesFaq
// відкочується на старий текст settings.faq_<lang>.
export type SiteFaqItem = {
  question_uk: string;
  question_pl: string;
  question_en: string;
  answer_uk: string;
  answer_pl: string;
  answer_en: string;
};

export async function getFaqItems(): Promise<SiteFaqItem[]> {
  const { data } = await supabase
    .from("faq_items")
    .select("question_uk, question_pl, question_en, answer_uk, answer_pl, answer_en")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  return (data ?? []) as SiteFaqItem[];
}

export type SiteLocation = {
  name: string | null;
  map_url: string | null;
  youtube_url: string | null; // посилання на відео локації (YouTube) — вбудований програвач у картці
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
  announcement: string | null; // повний текст анонсу (як у Телеграмі), null якщо нема локації
  scenario_pl: string | null; // опис сценарію (PL) — для короткого тізера на лендінгу
  scenario_uk: string | null; // опис сценарію (UA) — для короткого тізера на лендінгу
  limits: LocationLimits | null; // ліміти локації (репліки/піро/режим вогню) для тізера
  showCount: boolean; // показувати лічильник записаних (тумблер feature_announce_count, як в анонсі)
};

const GAME_COLS =
  "id, title, start_at, gather_at, capacity, status, scenario_pl, scenario_uk, locations(name, map_url, youtube_url, lat, lng, replica_types, pyro, pyro_note_pl, pyro_note_uk, fire_mode, payment_pl, payment_uk)";

// Нормалізує вкладену локацію (Supabase повертає масив/обʼєкт залежно від звʼязку).
function normLoc(row: any): SiteLocation | null {
  const l = Array.isArray(row?.locations) ? row.locations[0] : row?.locations;
  if (!l) return null;
  return {
    name: l.name ?? null,
    map_url: l.map_url ?? null,
    youtube_url: l.youtube_url ?? null,
    lat: l.lat ?? null,
    lng: l.lng ?? null,
  };
}

// Ліміти локації (репліки/піро/режим вогню) — ті самі дані, що й у блоці лімітів анонсу.
function normLimits(row: any): LocationLimits | null {
  const l = Array.isArray(row?.locations) ? row.locations[0] : row?.locations;
  if (!l) return null;
  return {
    replicaTypes: l.replica_types ?? [],
    pyro: l.pyro ?? "no",
    pyroNotePl: l.pyro_note_pl ?? null,
    pyroNoteUk: l.pyro_note_uk ?? null,
    fireMode: l.fire_mode ?? "semi",
  };
}

// Відтворює той самий анонс, що бот постить у Телеграм (lib/bot.ts → updateAnnouncement),
// з даних, які бот уже зберіг у БД. Bot API не вміє читати назад текст повідомлення за ID.
function buildGameAnnouncement(
  row: any,
  count: number,
  settings: Record<string, string>,
): string | null {
  const loc = Array.isArray(row?.locations) ? row.locations[0] : row?.locations;
  if (!loc || loc.lat == null || loc.lng == null) return null;
  return buildAnnouncement(
    {
      title: row.title ?? null,
      lat: loc.lat,
      lng: loc.lng,
      mapUrl: loc.map_url ?? null,
      gatherUtc: row.gather_at ?? row.start_at,
      startUtc: row.start_at,
      scenarioPl: row.scenario_pl ?? null,
      scenarioUk: row.scenario_uk ?? null,
      count,
      capacity: row.capacity ?? null,
      replicaTypes: loc.replica_types ?? [],
      pyro: loc.pyro ?? "no",
      pyroNotePl: loc.pyro_note_pl ?? null,
      pyroNoteUk: loc.pyro_note_uk ?? null,
      fireMode: loc.fire_mode ?? "semi",
      paymentPl: loc.payment_pl ?? null,
      paymentUk: loc.payment_uk ?? null,
    },
    settings,
  );
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

function toSiteGame(row: any, count: number, settings?: Record<string, string>): SiteGame {
  return {
    id: row.id,
    title: row.title ?? null,
    start_at: row.start_at,
    gather_at: row.gather_at ?? null,
    capacity: row.capacity ?? null,
    status: row.status,
    location: normLoc(row),
    count,
    announcement: settings ? buildGameAnnouncement(row, count, settings) : null,
    scenario_pl: row.scenario_pl ?? null,
    scenario_uk: row.scenario_uk ?? null,
    limits: normLimits(row),
    // Той самий критерій, що й у buildAnnouncement: показуємо, доки тумблер не вимкнено явно.
    showCount: settings?.["feature_announce_count"] !== "false",
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
  const [counts, settings] = await Promise.all([countsFor([data.id as number]), getAllSettings()]);
  return toSiteGame(data, counts.get(data.id as number) ?? 0, settings);
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
  const [counts, settings] = await Promise.all([
    countsFor(rows.map((r) => r.id as number)),
    getAllSettings(),
  ]);
  return rows.map((r) => toSiteGame(r, counts.get(r.id as number) ?? 0, settings));
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
  const [counts, settings] = await Promise.all([
    countsFor(rows.map((r) => r.id as number)),
    getAllSettings(),
  ]);
  return rows.map((r) => toSiteGame(r, counts.get(r.id as number) ?? 0, settings));
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

// Публічний рейтинг за «зароблено всього» (як бот /top). Топ-N. Адмінів і майстра не показуємо.
export async function getRanking(limit = 10): Promise<RankingRow[]> {
  const { data } = await supabase
    .from("players")
    .select("id, callsign, name, rank, has_patch, points_earned, games_played")
    .eq("is_admin", false)
    .eq("is_master", false)
    .or("points_earned.gt.0,games_played.gt.0")
    .order("points_earned", { ascending: false })
    .order("games_played", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);
  return (data ?? []) as RankingRow[];
}

// Здобута ачівка для рейтингу (іконка + локалізована назва й опис як підказка).
export type RankAch = {
  code: string;
  title_pl: string | null;
  title_en: string | null;
  title_uk: string | null;
  description_pl: string | null;
  description_en: string | null;
  description_uk: string | null;
  thumbnail_svg: string | null;
};

// Bulk: здобуті ачівки для багатьох гравців одним запитом (player_id IN …), з назвами, описом і мініатюрою.
async function getPlayerAchievementsForMany(playerIds: number[]): Promise<Map<number, RankAch[]>> {
  const map = new Map<number, RankAch[]>();
  if (playerIds.length === 0) return map;
  const { data } = await supabase
    .from("player_achievements")
    .select(
      "player_id, code, achievements(title_pl, title_en, title_uk, description_pl, description_en, description_uk, thumbnail_svg)",
    )
    .in("player_id", playerIds)
    .order("created_at", { ascending: false });
  for (const r of (data ?? []) as any[]) {
    const a = Array.isArray(r.achievements) ? r.achievements[0] : r.achievements;
    const arr = map.get(r.player_id as number) ?? [];
    arr.push({
      code: r.code as string,
      title_pl: a?.title_pl ?? null,
      title_en: a?.title_en ?? null,
      title_uk: a?.title_uk ?? null,
      description_pl: a?.description_pl ?? null,
      description_en: a?.description_en ?? null,
      description_uk: a?.description_uk ?? null,
      thumbnail_svg: a?.thumbnail_svg ?? null,
    });
    map.set(r.player_id as number, arr);
  }
  return map;
}

// Рейтинг + здобуті ачівки кожного гравця (для показу іконок у таблиці на лендінгу).
export async function getRankingWithAchievements(
  limit = 10,
): Promise<(RankingRow & { achievements: RankAch[] })[]> {
  const rows = await getRanking(limit);
  const achMap = await getPlayerAchievementsForMany(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, achievements: achMap.get(r.id) ?? [] }));
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
  const [counts, regsRes, checksRes, settings] = await Promise.all([
    countsFor(ids),
    supabase.from("registrations").select("game_id, status").eq("player_id", playerId).in("game_id", ids),
    supabase.from("checkins").select("game_id").eq("player_id", playerId).in("game_id", ids),
    getAllSettings(),
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
      ...toSiteGame(r, count, settings),
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
  itemTitle: string | null; // заповнюється лише для reason=purchase
};

// Останні рухи балів гравця (журнал point_log).
// Для покупок магазину підтягує назву товару з shop_items.
export async function getPointLog(playerId: number, lang = "uk", limit = 25): Promise<PointLogRow[]> {
  const { data } = await supabase
    .from("point_log")
    .select("delta, reason, meta, game_id, created_at")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as Omit<PointLogRow, "itemTitle">[];

  // Резолвимо назви товарів одним запитом.
  const itemIds = [...new Set(
    rows
      .filter((r) => r.reason === "purchase" && r.meta?.startsWith("shop:"))
      .map((r) => Number(r.meta!.split(":")[1]))
      .filter((id) => Number.isFinite(id)),
  )];
  const itemMap = new Map<number, string>();
  if (itemIds.length) {
    const { data: items } = await supabase
      .from("shop_items")
      .select("id, title_pl, title_en, title_uk")
      .in("id", itemIds);
    for (const it of items ?? []) {
      const title =
        (lang === "pl" ? it.title_pl : lang === "en" ? it.title_en : it.title_uk) ??
        it.title_pl ?? it.title_en ?? it.title_uk ?? null;
      itemMap.set(it.id as number, title as string);
    }
  }

  return rows.map((r) => ({
    ...r,
    itemTitle:
      r.reason === "purchase" && r.meta?.startsWith("shop:")
        ? (itemMap.get(Number(r.meta.split(":")[1])) ?? null)
        : null,
  }));
}

export type PlayerAch = {
  code: string;
  created_at: string;
  title_pl: string | null;
  title_en: string | null;
  title_uk: string | null;
  description_pl: string | null;
  description_en: string | null;
  description_uk: string | null;
  thumbnail_svg: string | null;
};

export type ShopItem = {
  id: number;
  title_pl: string | null;
  title_en: string | null;
  title_uk: string | null;
  desc_pl: string | null;
  desc_en: string | null;
  desc_uk: string | null;
  cost: number;
  active: boolean;
  sort: number;
};

// Товари магазину (6.3). activeOnly=true для вітрини, false для адмінки.
export async function getShopItems(activeOnly = true): Promise<ShopItem[]> {
  let q = supabase
    .from("shop_items")
    .select("id, title_pl, title_en, title_uk, desc_pl, desc_en, desc_uk, cost, active, sort")
    .order("sort", { ascending: true })
    .order("id", { ascending: true });
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as ShopItem[];
}

// ─────────────────────────────── Галерея (Етап 15) ───────────────────────────────

export type GalleryPhoto = {
  id: number;
  url: string;
  caption: string | null;
};

// Випадкова добірка видимих фото для публічної /gallery.
// Беремо обмежений пул останніх схвалених і перемішуємо у Node (Fisher–Yates) —
// надійніше за ORDER BY random() через PostgREST і не залежить від розміру таблиці.
export async function getGalleryPhotos(limit = 24): Promise<GalleryPhoto[]> {
  const { data } = await supabase
    .from("gallery_media")
    .select("id, public_url, caption")
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as { id: number; public_url: string; caption: string | null }[];
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows.slice(0, limit).map((r) => ({ id: r.id, url: r.public_url, caption: r.caption }));
}

// ─────────────────────────── Барахолка / Marketplace (Етап 28) ───────────────────────────

export type MarketplaceListing = {
  id: number;
  photos: string[];
  description: string | null;
  price: string | null;
  sellerUsername: string | null;
  sellerDisplay: string | null;
  createdAt: string;
};

// Опубліковані оголошення для публічної /marketplace (новіші — згори).
export async function getMarketplaceListings(limit = 60): Promise<MarketplaceListing[]> {
  const { data } = await supabase
    .from("marketplace_listings")
    .select("id, photo_urls, description, price, seller_tg_username, seller_display, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapListing);
}

function mapListing(r: any): MarketplaceListing {
  return {
    id: r.id,
    photos: (r.photo_urls ?? []) as string[],
    description: r.description ?? null,
    price: r.price ?? null,
    sellerUsername: r.seller_tg_username ?? null,
    sellerDisplay: r.seller_display ?? null,
    createdAt: r.created_at,
  };
}

// Випадкові N схвалених оголошень — для тізера на лендінгу (карусель).
export async function getMarketplaceTeaser(count = 7): Promise<MarketplaceListing[]> {
  const { data } = await supabase
    .from("marketplace_listings")
    .select("id, photo_urls, description, price, seller_tg_username, seller_display, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(60);
  const rows = (data ?? []).map(mapListing);
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows.slice(0, count);
}

// Сторінка барахолки з пагінацією (за замовчуванням 25 на сторінку) + загальна кількість.
export async function getMarketplacePage(
  page = 1,
  perPage = 25,
): Promise<{ listings: MarketplaceListing[]; total: number }> {
  const from = (Math.max(1, page) - 1) * perPage;
  const { data, count } = await supabase
    .from("marketplace_listings")
    .select("id, photo_urls, description, price, seller_tg_username, seller_display, created_at", {
      count: "exact",
    })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);
  return { listings: (data ?? []).map(mapListing), total: count ?? 0 };
}

// ─────────────────────────── Карпул-мапа (Етап 34) ───────────────────────────

export type CarpoolDriver = {
  playerId: number;
  callsign: string | null;
  name: string | null;
  tgUsername: string | null;
  fromPlace: string | null;
  ridePrice: number | null; // ціна за місце (zł)
  freeSeats: number;
  seatsClosed: boolean;
  lat: number; // чужим — округлено до ~110 м (приватність); собі — точно
  lng: number;
  isMe: boolean;
  myRequest: "pending" | "accepted" | "declined" | null; // статус запиту глядача саме цьому водієві
};

export type CarpoolIncoming = {
  requestId: number;
  passengerCallsign: string | null;
  passengerName: string | null;
  passengerTgUsername: string | null;
};

export type CarpoolMe = {
  playerId: number;
  registered: boolean; // status='registered' на цю гру
  transport: "own" | "need" | null;
  isDriver: boolean; // registered + transport='own'
  fromLat: number | null;
  fromLng: number | null;
  ridePrice: number | null;
  freeSeats: number | null;
  seatsClosed: boolean;
};

export type CarpoolData = {
  game: { id: number; title: string | null; startAt: string; gatherAt: string | null; status: string };
  venue: { name: string | null; lat: number; lng: number; radiusM: number } | null;
  drivers: CarpoolDriver[];
  me: CarpoolMe | null; // null для anon
  incoming: CarpoolIncoming[]; // pending-запити, де глядач — водій (для accept/decline на сайті)
};

// Дані для сторінки /carpool: гра + полігон + водії з координатами + стан глядача.
// playerId=null → лише перегляд (anon). null повертаємо, якщо гри нема.
export async function getCarpool(gameId: number, playerId: number | null): Promise<CarpoolData | null> {
  const { data: game } = await supabase
    .from("games")
    .select("id, title, start_at, gather_at, status, locations(name, lat, lng, radius_m)")
    .eq("id", gameId)
    .maybeSingle();
  if (!game) return null;

  const loc = Array.isArray((game as any).locations)
    ? (game as any).locations[0]
    : (game as any).locations;
  const venue =
    loc && loc.lat != null && loc.lng != null
      ? {
          name: loc.name ?? null,
          lat: loc.lat as number,
          lng: loc.lng as number,
          radiusM: (loc.radius_m as number) ?? 300,
        }
      : null;

  // Водії «своїм ходом», що поставили точку виїзду.
  const { data: rows } = await supabase
    .from("registrations")
    .select("player_id, from_place, from_lat, from_lng, ride_price, free_seats, seats_closed, players(callsign, name, tg_username)")
    .eq("game_id", gameId)
    .eq("status", "registered")
    .eq("transport", "own")
    .not("from_lat", "is", null)
    .not("from_lng", "is", null);

  const myOutgoing = new Map<number, string>();
  let me: CarpoolMe | null = null;
  let incoming: CarpoolIncoming[] = [];

  if (playerId != null) {
    const [{ data: myReg }, { data: out }, { data: inc }] = await Promise.all([
      supabase
        .from("registrations")
        .select("transport, status, from_lat, from_lng, ride_price, free_seats, seats_closed")
        .eq("game_id", gameId)
        .eq("player_id", playerId)
        .maybeSingle(),
      supabase
        .from("ride_requests")
        .select("driver_player_id, status")
        .eq("game_id", gameId)
        .eq("passenger_id", playerId)
        .in("status", ["pending", "accepted", "declined"]),
      supabase
        .from("ride_requests")
        .select("id, passenger_id")
        .eq("game_id", gameId)
        .eq("driver_player_id", playerId)
        .eq("status", "pending"),
    ]);

    // Найрелевантніший статус по водієві: pending/accepted перекриває declined.
    for (const r of out ?? []) {
      const prev = myOutgoing.get(r.driver_player_id as number);
      if (!prev || prev === "declined") myOutgoing.set(r.driver_player_id as number, r.status as string);
    }

    const registered = myReg?.status === "registered";
    me = {
      playerId,
      registered,
      transport: ((myReg?.transport as any) ?? null) as CarpoolMe["transport"],
      isDriver: registered && myReg?.transport === "own",
      fromLat: myReg?.from_lat ?? null,
      fromLng: myReg?.from_lng ?? null,
      ridePrice: myReg?.ride_price ?? null,
      freeSeats: myReg?.free_seats ?? null,
      seatsClosed: !!myReg?.seats_closed,
    };

    // Контакти пасажирів вхідних запитів — окремим запитом (без покладання на ім'я FK).
    const paxIds = [...new Set((inc ?? []).map((r) => r.passenger_id as number))];
    const paxMap = new Map<number, any>();
    if (paxIds.length) {
      const { data: paxes } = await supabase
        .from("players")
        .select("id, callsign, name, tg_username")
        .in("id", paxIds);
      for (const p of paxes ?? []) paxMap.set(p.id as number, p);
    }
    incoming = (inc ?? []).map((r) => {
      const p = paxMap.get(r.passenger_id as number);
      return {
        requestId: r.id as number,
        passengerCallsign: p?.callsign ?? null,
        passengerName: p?.name ?? null,
        passengerTgUsername: p?.tg_username ?? null,
      };
    });
  }

  const round3 = (n: number) => Math.round(n * 1000) / 1000;
  const drivers: CarpoolDriver[] = (rows ?? []).map((d: any) => {
    const pl = Array.isArray(d.players) ? d.players[0] : d.players;
    const isMe = playerId != null && d.player_id === playerId;
    return {
      playerId: d.player_id,
      callsign: pl?.callsign ?? null,
      name: pl?.name ?? null,
      tgUsername: pl?.tg_username ?? null,
      fromPlace: d.from_place ?? null,
      ridePrice: d.ride_price ?? null,
      freeSeats: d.free_seats ?? 0,
      seatsClosed: !!d.seats_closed,
      lat: isMe ? d.from_lat : round3(d.from_lat),
      lng: isMe ? d.from_lng : round3(d.from_lng),
      isMe,
      myRequest: (myOutgoing.get(d.player_id) as CarpoolDriver["myRequest"]) ?? null,
    };
  });

  return {
    game: {
      id: game.id as number,
      title: game.title ?? null,
      startAt: game.start_at as string,
      gatherAt: game.gather_at ?? null,
      status: game.status as string,
    },
    venue,
    drivers,
    me,
    incoming,
  };
}

// Здобуті ачівки гравця (з назвами).
export async function getPlayerAchievements(playerId: number): Promise<PlayerAch[]> {
  const { data } = await supabase
    .from("player_achievements")
    .select(
      "code, created_at, achievements(title_pl, title_en, title_uk, description_pl, description_en, description_uk, thumbnail_svg)",
    )
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
      description_pl: a?.description_pl ?? null,
      description_en: a?.description_en ?? null,
      description_uk: a?.description_uk ?? null,
      thumbnail_svg: a?.thumbnail_svg ?? null,
    };
  });
}
