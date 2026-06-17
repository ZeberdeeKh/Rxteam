import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionPlayer } from "@/lib/site-player";
import { hasPerm } from "@/lib/admin";

export const dynamic = "force-dynamic";

// CSV-екранування поля.
function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

// Один дозвіл "export" керує всім субменю експорту.
const KINDS = new Set(["players", "registrations", "checkins"]);

export async function GET(_req: NextRequest, { params }: { params: { kind: string } }) {
  const kind = params.kind;
  if (!KINDS.has(kind)) return new Response("Not found", { status: 404 });

  const me = await getSessionPlayer();
  if (!hasPerm(me, "export")) return new Response("Not found", { status: 404 });

  let csv = "";
  if (kind === "players") {
    const { data } = await supabase
      .from("players")
      .select(
        "id, callsign, name, tg_username, points_earned, points_balance, games_played, has_patch, rank",
      )
      .order("id", { ascending: true });
    csv = toCsv(
      ["id", "callsign", "name", "tg_username", "earned", "balance", "games", "patch", "rank"],
      (data ?? []).map((p) => [
        p.id,
        p.callsign,
        p.name,
        p.tg_username,
        p.points_earned,
        p.points_balance,
        p.games_played,
        p.has_patch,
        p.rank,
      ]),
    );
  } else if (kind === "registrations") {
    const { data } = await supabase
      .from("registrations")
      .select(
        "status, needs_rental, transport, from_place, free_seats, created_at, games(id, title, start_at), players(callsign, name)",
      )
      .order("created_at", { ascending: false });
    csv = toCsv(
      ["game_id", "game", "start_at", "player", "status", "needs_rental", "transport", "from_place", "free_seats"],
      (data ?? []).map((r: any) => {
        const g = one(r.games);
        const p = one(r.players);
        return [
          g?.id,
          g?.title,
          g?.start_at,
          p?.callsign ?? p?.name,
          r.status,
          r.needs_rental,
          r.transport,
          r.from_place,
          r.free_seats,
        ];
      }),
    );
  } else {
    const { data } = await supabase
      .from("checkins")
      .select("game_id, source, is_manual, distance_m, created_at, players(callsign, name)")
      .order("created_at", { ascending: false });
    csv = toCsv(
      ["game_id", "player", "source", "is_manual", "distance_m", "created_at"],
      (data ?? []).map((c: any) => {
        const p = one(c.players);
        return [c.game_id, p?.callsign ?? p?.name, c.source, c.is_manual, c.distance_m, c.created_at];
      }),
    );
  }

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}.csv"`,
    },
  });
}
