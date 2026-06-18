import { supabase } from "./supabase";
import { getShopItems, type ShopItem } from "./site-data";

// Серверні читання для адмінки (6.4). Лише з адмін-гейтом у викликачах.

export type AdminGameRow = {
  id: number;
  title: string | null;
  start_at: string;
  gather_at: string | null;
  status: string;
  capacity: number | null;
  location_name: string | null;
  regCount: number;
  checkinCount: number;
};

export async function listGamesAdmin(limit = 50): Promise<AdminGameRow[]> {
  const { data: games } = await supabase
    .from("games")
    .select("id, title, start_at, gather_at, status, capacity, locations(name)")
    .order("start_at", { ascending: false })
    .limit(limit);
  const rows = games ?? [];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id as number);

  const [{ data: regs }, { data: checks }] = await Promise.all([
    supabase.from("registrations").select("game_id").in("game_id", ids).eq("status", "registered"),
    supabase.from("checkins").select("game_id").in("game_id", ids),
  ]);
  const reg = new Map<number, number>();
  for (const r of regs ?? []) reg.set(r.game_id as number, (reg.get(r.game_id as number) ?? 0) + 1);
  const chk = new Map<number, number>();
  for (const c of checks ?? []) chk.set(c.game_id as number, (chk.get(c.game_id as number) ?? 0) + 1);

  return rows.map((r) => {
    const loc = Array.isArray((r as any).locations) ? (r as any).locations[0] : (r as any).locations;
    return {
      id: r.id as number,
      title: r.title ?? null,
      start_at: r.start_at as string,
      gather_at: (r as any).gather_at ?? null,
      status: r.status as string,
      capacity: r.capacity ?? null,
      location_name: loc?.name ?? null,
      regCount: reg.get(r.id as number) ?? 0,
      checkinCount: chk.get(r.id as number) ?? 0,
    };
  });
}

export type AdminReg = {
  playerId: number;
  callsign: string | null;
  name: string | null;
  status: string;
  needs_rental: boolean;
  transport: string | null;
  from_place: string | null;
  free_seats: number | null;
  checkedIn: boolean;
};

export type AdminGameDetail = {
  id: number;
  title: string | null;
  start_at: string;
  gather_at: string | null;
  status: string;
  capacity: number | null;
  location_name: string | null;
  regs: AdminReg[];
};

export async function getGameDetail(gameId: number): Promise<AdminGameDetail | null> {
  const { data: game } = await supabase
    .from("games")
    .select("id, title, start_at, gather_at, status, capacity, locations(name)")
    .eq("id", gameId)
    .maybeSingle();
  if (!game) return null;

  const [{ data: regs }, { data: checks }] = await Promise.all([
    supabase
      .from("registrations")
      .select("status, needs_rental, transport, from_place, free_seats, players(id, callsign, name)")
      .eq("game_id", gameId),
    supabase.from("checkins").select("player_id").eq("game_id", gameId),
  ]);
  const checkedSet = new Set((checks ?? []).map((c) => c.player_id as number));

  const loc = Array.isArray((game as any).locations)
    ? (game as any).locations[0]
    : (game as any).locations;

  const rows: AdminReg[] = (regs ?? []).map((r: any) => {
    const pl = Array.isArray(r.players) ? r.players[0] : r.players;
    return {
      playerId: pl?.id,
      callsign: pl?.callsign ?? null,
      name: pl?.name ?? null,
      status: r.status,
      needs_rental: !!r.needs_rental,
      transport: r.transport ?? null,
      from_place: r.from_place ?? null,
      free_seats: r.free_seats ?? null,
      checkedIn: checkedSet.has(pl?.id),
    };
  });

  return {
    id: game.id as number,
    title: game.title ?? null,
    start_at: game.start_at as string,
    gather_at: (game as any).gather_at ?? null,
    status: game.status as string,
    capacity: game.capacity ?? null,
    location_name: loc?.name ?? null,
    regs: rows,
  };
}

export type AdminPlayer = {
  id: number;
  callsign: string | null;
  name: string | null;
  tg_username: string | null;
  points_earned: number;
  points_balance: number;
  games_played: number;
  has_patch: boolean;
  rank: string | null;
  is_admin: boolean;
  is_master: boolean;
  admin_perms: string[];
};

export async function listPlayers(limit = 300): Promise<AdminPlayer[]> {
  const { data } = await supabase
    .from("players")
    .select(
      "id, callsign, name, tg_username, points_earned, points_balance, games_played, has_patch, rank, is_admin, is_master, admin_perms",
    )
    .order("id", { ascending: true })
    .limit(limit);
  return (data ?? []) as AdminPlayer[];
}

export type AdminReferral = {
  id: number;
  status: string;
  created_at: string;
  inviter: string;
  invited: string;
};

export async function listReferrals(limit = 100): Promise<AdminReferral[]> {
  const { data } = await supabase
    .from("referrals")
    .select("id, status, created_at, inviter_id, invited_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.inviter_id, r.invited_id]))).filter(Boolean);
  const names = new Map<number, string>();
  if (ids.length) {
    const { data: pls } = await supabase
      .from("players")
      .select("id, callsign, name")
      .in("id", ids as number[]);
    for (const p of pls ?? [])
      names.set(p.id as number, (p.callsign as string) ?? (p.name as string) ?? `#${p.id}`);
  }
  return rows.map((r) => ({
    id: r.id as number,
    status: r.status as string,
    created_at: r.created_at as string,
    inviter: names.get(r.inviter_id as number) ?? `#${r.inviter_id}`,
    invited: names.get(r.invited_id as number) ?? `#${r.invited_id}`,
  }));
}

export type RentalReq = {
  gameId: number;
  gameTitle: string | null;
  start_at: string;
  callsign: string | null;
  name: string | null;
  status: string;
};

// Заявки на оренду (registrations.needs_rental) для майбутніх/нещодавніх ігор. Read-only.
export async function listRentalRequests(): Promise<RentalReq[]> {
  const { data } = await supabase
    .from("registrations")
    .select("status, games(id, title, start_at), players(callsign, name)")
    .eq("needs_rental", true)
    .eq("status", "registered")
    .limit(200);
  const rows = (data ?? []).map((r: any) => {
    const g = Array.isArray(r.games) ? r.games[0] : r.games;
    const p = Array.isArray(r.players) ? r.players[0] : r.players;
    return {
      gameId: g?.id,
      gameTitle: g?.title ?? null,
      start_at: g?.start_at ?? "",
      callsign: p?.callsign ?? null,
      name: p?.name ?? null,
      status: r.status,
    } as RentalReq;
  });
  return rows.sort((a, b) => (a.start_at < b.start_at ? 1 : -1));
}

export type JoinChallenge = {
  id: number;
  user_id: number;
  lang: string;
  status: string;
  created_at: string;
};

export async function listJoinChallenges(limit = 50): Promise<JoinChallenge[]> {
  const { data } = await supabase
    .from("join_challenges")
    .select("id, user_id, lang, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as JoinChallenge[];
}

export async function listLocations() {
  const { data } = await supabase
    .from("locations")
    .select("id, name")
    .order("name", { ascending: true });
  return (data ?? []) as { id: number; name: string }[];
}

// ── FAQ (Етап 30, право faq) — список усіх питань для адмінки (активні + сховані). ──
export type FaqItem = {
  id: number;
  question_uk: string;
  question_pl: string;
  question_en: string;
  answer_uk: string;
  answer_pl: string;
  answer_en: string;
  sort_order: number;
  active: boolean;
};

export async function listFaqItems(): Promise<FaqItem[]> {
  const { data } = await supabase
    .from("faq_items")
    .select(
      "id, question_uk, question_pl, question_en, answer_uk, answer_pl, answer_en, sort_order, active",
    )
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  return (data ?? []) as FaqItem[];
}

// ── Чек-лист підготовки до гри (Етап 13, майстер) ──
export type ChoreTemplate = {
  id: number;
  kind: string; // 'action' | 'gear'
  label: string;
  note: string | null;
  sort_order: number;
  active: boolean;
};

export async function listChoreTemplates(): Promise<ChoreTemplate[]> {
  const { data } = await supabase
    .from("chore_templates")
    .select("id, kind, label, note, sort_order, active")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []) as ChoreTemplate[];
}

export type AdminLocation = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  map_url: string | null;
  replica_types: string[]; // допущені типи реплік (коди з lib/replicas.ts)
  pyro: string; // yes | no | limited
  pyro_note_pl: string | null; // уточнення піро (PL) для анонсу
  pyro_note_uk: string | null; // уточнення піро (UA) для анонсу
  fire_mode: string; // auto | semi
  payment_pl: string | null; // текст блоку «Оплата» (PL) для анонсу
  payment_uk: string | null; // текст блоку «Оплата» (UA) для анонсу
  gameCount: number; // у скількох іграх використана (для блокування видалення)
};

export async function listLocationsFull(): Promise<AdminLocation[]> {
  const { data: locs } = await supabase
    .from("locations")
    .select("id, name, lat, lng, radius_m, map_url, replica_types, pyro, pyro_note_pl, pyro_note_uk, fire_mode, payment_pl, payment_uk")
    .order("name", { ascending: true });
  const rows = locs ?? [];
  if (!rows.length) return [];

  const { data: games } = await supabase.from("games").select("location_id");
  const used = new Map<number, number>();
  for (const g of games ?? []) {
    const id = g.location_id as number | null;
    if (id != null) used.set(id, (used.get(id) ?? 0) + 1);
  }
  return rows.map((l) => ({
    id: l.id as number,
    name: l.name as string,
    lat: l.lat as number,
    lng: l.lng as number,
    radius_m: (l.radius_m as number) ?? 300,
    map_url: (l.map_url as string) ?? null,
    replica_types: ((l as any).replica_types as string[]) ?? [],
    pyro: ((l as any).pyro as string) ?? "no",
    pyro_note_pl: ((l as any).pyro_note_pl as string) ?? null,
    pyro_note_uk: ((l as any).pyro_note_uk as string) ?? null,
    fire_mode: ((l as any).fire_mode as string) ?? "semi",
    payment_pl: ((l as any).payment_pl as string) ?? null,
    payment_uk: ((l as any).payment_uk as string) ?? null,
    gameCount: used.get(l.id as number) ?? 0,
  }));
}

// ── Магазин за бали (адмінка) ──
// Каталог для адмінки: усі товари, зокрема неактивні. Переюз read-шляху з site-data.
export async function listShopItemsAdmin(): Promise<ShopItem[]> {
  return getShopItems(false);
}

// ── Фото-галерея (Етап 15) ──
export type AdminGalleryItem = {
  id: number;
  public_url: string;
  status: string; // visible | hidden
  caption: string | null;
  created_at: string;
};

// Усі фото галереї для модерації в адмінці (новіші — згори).
export async function listGalleryMedia(limit = 200): Promise<AdminGalleryItem[]> {
  const { data } = await supabase
    .from("gallery_media")
    .select("id, public_url, status, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AdminGalleryItem[];
}

// ── Барахолка / Marketplace (Етап 28) ──
export type AdminMarketplaceItem = {
  id: number;
  status: string; // pending | approved | hidden | rejected | sold | expired
  description: string | null;
  price: string | null;
  photo_urls: string[];
  seller_display: string | null;
  seller_tg_username: string | null;
  created_at: string;
};

// Оголошення для модерації (без collecting/deleted). Pending — згори, далі за датою.
export async function listMarketplaceListings(limit = 200): Promise<AdminMarketplaceItem[]> {
  const { data } = await supabase
    .from("marketplace_listings")
    .select("id, status, description, price, photo_urls, seller_display, seller_tg_username, created_at")
    .in("status", ["pending", "approved", "hidden", "rejected", "sold", "expired"])
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as AdminMarketplaceItem[];
  // Pending — нагору (потребують дії), решта — за датою спадання.
  return rows.sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
}

export type AdminPurchase = {
  id: number;
  cost: number;
  created_at: string;
  fulfilled: boolean;
  fulfilled_at: string | null;
  callsign: string | null;
  name: string | null;
  itemTitle: { pl: string | null; en: string | null; uk: string | null } | null;
};

// Журнал покупок: спершу невидані, потім за датою спадання.
export async function listPurchasesAdmin(limit = 200): Promise<AdminPurchase[]> {
  const { data } = await supabase
    .from("purchases")
    .select(
      "id, cost, created_at, fulfilled, fulfilled_at, players(callsign, name), shop_items(title_pl, title_en, title_uk)",
    )
    .order("fulfilled", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: any) => {
    const p = Array.isArray(r.players) ? r.players[0] : r.players;
    const it = Array.isArray(r.shop_items) ? r.shop_items[0] : r.shop_items;
    return {
      id: r.id as number,
      cost: r.cost as number,
      created_at: r.created_at as string,
      fulfilled: !!r.fulfilled,
      fulfilled_at: r.fulfilled_at ?? null,
      callsign: p?.callsign ?? null,
      name: p?.name ?? null,
      itemTitle: it
        ? { pl: it.title_pl ?? null, en: it.title_en ?? null, uk: it.title_uk ?? null }
        : null,
    };
  });
}

// ── Ачівки (адмінка) ──
export type AdminAchievement = {
  code: string;
  title_pl: string | null;
  title_en: string | null;
  title_uk: string | null;
  tier: string; // easy | mid | hard (визначає бали через settings)
  enabled: boolean;
  thumbnail_svg: string | null; // base64 data URL SVG-мініатюри (Етап 20) або null
  description_pl: string | null; // за що дається / тригер (Етап 21)
  description_en: string | null;
  description_uk: string | null;
  kind: string; // auto (складна код-логіка) | manual (видає адмін) — Етап 21
  earnedCount: number; // скільки гравців уже здобули (блокує видалення)
};

// Каталог ачівок для адмінки: усі, зокрема вимкнені, з лічильником здобуттів.
export async function listAchievementsAdmin(): Promise<AdminAchievement[]> {
  const [{ data: achs }, { data: earned }] = await Promise.all([
    supabase
      .from("achievements")
      .select(
        "code, title_pl, title_en, title_uk, tier, enabled, thumbnail_svg, description_pl, description_en, description_uk, kind",
      )
      .order("code", { ascending: true }),
    supabase.from("player_achievements").select("code"),
  ]);
  const counts = new Map<string, number>();
  for (const r of (earned ?? []) as { code: string }[]) {
    counts.set(r.code, (counts.get(r.code) ?? 0) + 1);
  }
  return ((achs ?? []) as any[]).map((a) => ({
    code: a.code as string,
    title_pl: a.title_pl ?? null,
    title_en: a.title_en ?? null,
    title_uk: a.title_uk ?? null,
    tier: (a.tier as string) ?? "mid",
    enabled: !!a.enabled,
    thumbnail_svg: a.thumbnail_svg ?? null,
    description_pl: a.description_pl ?? null,
    description_en: a.description_en ?? null,
    description_uk: a.description_uk ?? null,
    kind: (a.kind as string) ?? "manual",
    earnedCount: counts.get(a.code as string) ?? 0,
  }));
}

export type AdminPlayerAchievement = {
  id: number;
  code: string;
  created_at: string;
  callsign: string | null;
  name: string | null;
  achTitle: { pl: string | null; en: string | null; uk: string | null } | null;
};

// Журнал здобутих ачівок: новіші — згори.
export async function listPlayerAchievementsAdmin(limit = 200): Promise<AdminPlayerAchievement[]> {
  const { data } = await supabase
    .from("player_achievements")
    .select(
      "id, code, created_at, players(callsign, name), achievements(title_pl, title_en, title_uk)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: any) => {
    const p = Array.isArray(r.players) ? r.players[0] : r.players;
    const a = Array.isArray(r.achievements) ? r.achievements[0] : r.achievements;
    return {
      id: r.id as number,
      code: r.code as string,
      created_at: r.created_at as string,
      callsign: p?.callsign ?? null,
      name: p?.name ?? null,
      achTitle: a
        ? { pl: a.title_pl ?? null, en: a.title_en ?? null, uk: a.title_uk ?? null }
        : null,
    };
  });
}
