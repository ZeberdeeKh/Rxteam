import { supabase } from "./supabase";

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

// ── Чек-лист підготовки до гри (Етап 13, майстер) ──
export type ChoreTemplate = {
  id: number;
  kind: string; // 'action' | 'gear'
  label: string;
  sort_order: number;
  active: boolean;
};

export async function listChoreTemplates(): Promise<ChoreTemplate[]> {
  const { data } = await supabase
    .from("chore_templates")
    .select("id, kind, label, sort_order, active")
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
  pyro_note: string | null; // уточнення для «з обмеженням»
  fire_mode: string; // auto | semi
  gameCount: number; // у скількох іграх використана (для блокування видалення)
};

export async function listLocationsFull(): Promise<AdminLocation[]> {
  const { data: locs } = await supabase
    .from("locations")
    .select("id, name, lat, lng, radius_m, map_url, replica_types, pyro, pyro_note, fire_mode")
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
    pyro_note: ((l as any).pyro_note as string) ?? null,
    fire_mode: ((l as any).fire_mode as string) ?? "semi",
    gameCount: used.get(l.id as number) ?? 0,
  }));
}
