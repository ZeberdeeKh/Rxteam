import { NextResponse } from "next/server";
import { getSessionPlayer } from "@/lib/site-player";
import { getCarpool } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// Дані карпулу гри для вбудованої мапи у формі реєстрації (полігон + активні водії).
// Лише для залогінених (реєстрація все одно вимагає входу). Координати чужих — уже округлені в getCarpool.
export async function GET(_req: Request, { params }: { params: { gameId: string } }) {
  const player = await getSessionPlayer();
  if (!player) return NextResponse.json({ error: "auth" }, { status: 401 });

  const gameId = Number(params.gameId);
  if (!Number.isFinite(gameId)) return NextResponse.json({ error: "bad" }, { status: 400 });

  const data = await getCarpool(gameId, player.id);
  if (!data) return NextResponse.json({ error: "notfound" }, { status: 404 });

  return NextResponse.json({
    venue: data.venue,
    drivers: data.drivers.map((d) => ({
      playerId: d.playerId,
      label: d.callsign ?? d.name ?? "?",
      lat: d.lat,
      lng: d.lng,
      pickups: d.pickups,
      ridePrice: d.ridePrice,
      rideNote: d.rideNote,
      freeSeats: d.freeSeats,
      seatsClosed: d.seatsClosed,
      isMe: d.isMe,
    })),
  });
}
