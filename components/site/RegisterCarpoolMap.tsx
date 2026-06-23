"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from "react-leaflet";
import { st, type Lang } from "@/lib/site-i18n";
import { requestRideSeatInline, cancelRideSeatInline } from "@/app/carpool/actions";
import { btn } from "@/components/ui";

type Pt = { lat: number; lng: number };

export type RegisterMapDriver = {
  playerId: number;
  label: string;
  lat: number;
  lng: number;
  pickups: Pt[];
  ridePrice: number | null;
  rideNote: string | null;
  freeSeats: number;
  seatsClosed: boolean;
  isMe: boolean;
  myRequest: "pending" | "accepted" | "declined" | null; // стан мого запиту цьому водієві
  tgUsername: string | null; // @username для зв'язку, коли запит підтверджено
};

export type RegisterCarpoolMapProps = {
  lang: Lang;
  mode: "own" | "need";
  gameId: number;
  venue: { name: string | null; lat: number; lng: number; radiusM: number } | null;
  drivers: RegisterMapDriver[];
  pin: Pt | null; // моя точка виїзду (own)
  pickups: Pt[]; // мої точки підбору (own)
  onPick: (lat: number, lng: number) => void; // батько маршрутизує за режимом (виїзд/підбір)
};

// Бронювання місця у конкретного водія — кнопка в попапі мапи (лише для шукачів авто, mode="need").
// Серверні екшени викликаємо імперативно (мапа всередині <form> реєстрації), стан тримаємо локально.
function DriverBooking({ d, gameId, lang }: { d: RegisterMapDriver; gameId: number; lang: Lang }) {
  const initial = d.myRequest === "pending" || d.myRequest === "accepted" ? d.myRequest : "none";
  const [status, setStatus] = useState<"pending" | "accepted" | "none">(initial);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true);
    setErr(null);
    try {
      const res = await requestRideSeatInline(gameId, d.playerId);
      if (res.ok) {
        setStatus("pending");
        return;
      }
      // Лише причини з i18n-ключем показуємо дослівно; внутрішні (auth/disabled/bad) → загальна.
      const known = ["self", "duplicate", "closed", "full", "game_past", "driver_not_found"];
      setErr(st(lang, `carpool_err_${res.reason && known.includes(res.reason) ? res.reason : "generic"}`));
    } catch {
      setErr(st(lang, "carpool_err_generic"));
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    setErr(null);
    try {
      const res = await cancelRideSeatInline(gameId, d.playerId);
      if (res.ok) setStatus("none");
      else setErr(st(lang, "carpool_err_generic"));
    } catch {
      setErr(st(lang, "carpool_err_generic"));
    } finally {
      setBusy(false);
    }
  }

  if (status === "accepted") {
    return (
      <div className="mt-1 space-y-1">
        <p className="font-medium text-emerald-700">
          ✓ {st(lang, "carpool_request_accepted")}
          {d.tgUsername && (
            <>
              {" · "}
              <a href={`https://t.me/${d.tgUsername}`} target="_blank" rel="noopener noreferrer" className="underline">
                @{d.tgUsername}
              </a>
            </>
          )}
        </p>
        <button type="button" onClick={cancel} disabled={busy} className={btn("delete", "sm")}>
          {st(lang, "carpool_cancel_request")}
        </button>
        {err && <p className="text-red-600">{err}</p>}
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="mt-1 space-y-1">
        <p className="font-medium text-amber-700">{st(lang, "carpool_request_pending")}</p>
        <button type="button" onClick={cancel} disabled={busy} className={btn("delete", "sm")}>
          {st(lang, "carpool_cancel_request")}
        </button>
        {err && <p className="text-red-600">{err}</p>}
      </div>
    );
  }
  if (d.seatsClosed || d.freeSeats < 1) {
    return <p className="text-gray-500">{st(lang, "carpool_seats_closed")}</p>;
  }
  return (
    <div className="mt-1 space-y-1">
      <button type="button" onClick={request} disabled={busy} className={btn("action", "sm")}>
        {st(lang, "carpool_request_seat")}
      </button>
      {err && <p className="text-red-600">{err}</p>}
    </div>
  );
}

function pinIcon(emoji: string, border: string, bg: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:2px solid ${border};background:${bg};font-size:15px;line-height:1">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function pickupIcon(n: number) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border:2px solid #b45309;background:#fff;color:#b45309;font-size:10px;font-weight:700;border-radius:9999px">${n}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Маршрути водіїв: РІЗНІ кольори (щоб розрізняти трасу кожного), але ОДНАКОВА товщина всюди.
const ROUTE_WEIGHT = 4;
const ROUTE_COLORS = [
  "#ef4444", // red
  "#2563eb", // blue
  "#16a34a", // green
  "#9333ea", // purple
  "#0891b2", // cyan
  "#db2777", // pink
  "#ca8a04", // amber
  "#4f46e5", // indigo
];

// Маршрут по дорогах (OSRM, без ключа); при недоступності — пряма ламана через точки.
function DriverRoute({
  from,
  via,
  to,
  color,
}: {
  from: [number, number];
  via: [number, number][];
  to: [number, number];
  color: string;
}) {
  const straight = useMemo<[number, number][]>(() => [from, ...via, to], [from, via, to]);
  const [geo, setGeo] = useState<[number, number][] | null>(null);
  const key = JSON.stringify(straight);
  useEffect(() => {
    let cancelled = false;
    const path = straight.map((p) => `${p[1]},${p[0]}`).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("osrm"))))
      .then((j) => {
        const g = j?.routes?.[0]?.geometry?.coordinates;
        if (!cancelled && Array.isArray(g)) setGeo(g.map((c: number[]) => [c[1], c[0]] as [number, number]));
      })
      .catch(() => {
        if (!cancelled) setGeo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Polyline positions={geo ?? straight} pathOptions={{ color, weight: ROUTE_WEIGHT, opacity: 0.9 }} />;
}

function Clicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Повна мапа всередині форми:
//  own  → клік ставить точку виїзду / зупинку (за режимом батька), малюється маршрут;
//  need → перегляд активних водіїв із маршрутами й точками підбору.
export default function RegisterCarpoolMap({
  lang,
  mode,
  gameId,
  venue,
  drivers,
  pin,
  pickups,
  onPick,
}: RegisterCarpoolMapProps) {
  const venueIcon = useMemo(() => pinIcon("🎯", "#111", "#fff"), []);
  const driverIcon = useMemo(() => pinIcon("🚗", "#b45309", "#f6921e"), []);
  const meIcon = useMemo(() => pinIcon("🚙", "#111", "#fde68a"), []);

  const others = drivers.filter((d) => !d.isMe);
  const center: [number, number] = pin
    ? [pin.lat, pin.lng]
    : venue
      ? [venue.lat, venue.lng]
      : drivers[0]
        ? [drivers[0].lat, drivers[0].lng]
        : [51.107, 17.038];

  return (
    <div className="h-[500px] w-full overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={9} scrollWheelZoom className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {venue && (
          <>
            <Marker position={[venue.lat, venue.lng]} icon={venueIcon}>
              <Popup>{venue.name ?? st(lang, "carpool_venue")}</Popup>
            </Marker>
            <Circle
              center={[venue.lat, venue.lng]}
              radius={venue.radiusM}
              pathOptions={{ color: "#f6921e", weight: 1, fillOpacity: 0.08 }}
            />
          </>
        )}

        {/* Інші водії: маркер + маршрут + точки підбору */}
        {others.map((d) => (
          <Marker key={d.playerId} position={[d.lat, d.lng]} icon={driverIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{d.label}</p>
                {d.ridePrice != null && <p>{st(lang, "carpool_price", { price: d.ridePrice })}</p>}
                <p>
                  {d.seatsClosed
                    ? st(lang, "carpool_seats_closed")
                    : st(lang, "carpool_seats_free", { n: d.freeSeats })}
                </p>
                {d.rideNote && <p className="italic">“{d.rideNote}”</p>}
                {/* Шукач авто бронює місце прямо тут */}
                {mode === "need" && <DriverBooking d={d} gameId={gameId} lang={lang} />}
              </div>
            </Popup>
          </Marker>
        ))}
        {venue &&
          others.map((d, i) => (
            <DriverRoute
              key={`route-${d.playerId}`}
              from={[d.lat, d.lng]}
              via={d.pickups.map((p) => [p.lat, p.lng] as [number, number])}
              to={[venue.lat, venue.lng]}
              color={ROUTE_COLORS[i % ROUTE_COLORS.length]}
            />
          ))}
        {others.flatMap((d) =>
          d.pickups.map((p, i) => (
            <Marker key={`pk-${d.playerId}-${i}`} position={[p.lat, p.lng]} icon={pickupIcon(i + 1)} />
          )),
        )}

        {/* Я-водій: точка виїзду + зупинки + живий маршрут + клік */}
        {mode === "own" && pin && <Marker position={[pin.lat, pin.lng]} icon={meIcon} />}
        {mode === "own" &&
          pickups.map((p, i) => (
            <Marker key={`mine-pk-${i}`} position={[p.lat, p.lng]} icon={pickupIcon(i + 1)} />
          ))}
        {mode === "own" && venue && pin && (
          <DriverRoute
            from={[pin.lat, pin.lng]}
            via={pickups.map((p) => [p.lat, p.lng] as [number, number])}
            to={[venue.lat, venue.lng]}
            color={ROUTE_COLORS[others.length % ROUTE_COLORS.length]}
          />
        )}
        {mode === "own" && <Clicker onPick={onPick} />}
      </MapContainer>
    </div>
  );
}
