"use client";

import { useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import { st, type Lang } from "@/lib/site-i18n";

type Pt = { lat: number; lng: number };

export type RegisterMapDriver = {
  playerId: number;
  label: string;
  lat: number;
  lng: number;
  pickups: Pt[];
  ridePrice: number | null;
  freeSeats: number;
  seatsClosed: boolean;
  isMe: boolean;
};

export type RegisterCarpoolMapProps = {
  lang: Lang;
  mode: "own" | "need";
  venue: { name: string | null; lat: number; lng: number; radiusM: number } | null;
  drivers: RegisterMapDriver[];
  pin: Pt | null; // обрана точка виїзду (режим own)
  onPick: (lat: number, lng: number) => void;
};

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

// Клік по мапі → обрати точку виїзду (лише режим own).
function Clicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Компактна мапа всередині форми реєстрації:
//  own  → клік ставить точку виїзду (+ для контексту видно полігон і чужих водіїв);
//  need → лише перегляд активних водіїв навколо полігону.
export default function RegisterCarpoolMap({
  lang,
  mode,
  venue,
  drivers,
  pin,
  onPick,
}: RegisterCarpoolMapProps) {
  const venueIcon = useMemo(() => pinIcon("🎯", "#111", "#fff"), []);
  const driverIcon = useMemo(() => pinIcon("🚗", "#b45309", "#f6921e"), []);
  const meIcon = useMemo(() => pinIcon("🚙", "#111", "#fde68a"), []);

  const center: [number, number] = pin
    ? [pin.lat, pin.lng]
    : venue
      ? [venue.lat, venue.lng]
      : drivers[0]
        ? [drivers[0].lat, drivers[0].lng]
        : [51.107, 17.038];

  return (
    <div className="h-72 w-full overflow-hidden border border-gray-200">
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

        {/* Активні водії (для контексту в own, основне у need) */}
        {drivers.map((d) => (
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
              </div>
            </Popup>
          </Marker>
        ))}
        {drivers.flatMap((d) =>
          d.pickups.map((p, i) => (
            <Marker key={`pk-${d.playerId}-${i}`} position={[p.lat, p.lng]} icon={pickupIcon(i + 1)} />
          )),
        )}

        {/* Режим own: обрана точка виїзду + обробник кліку */}
        {mode === "own" && pin && <Marker position={[pin.lat, pin.lng]} icon={meIcon} />}
        {mode === "own" && <Clicker onPick={onPick} />}
      </MapContainer>
    </div>
  );
}
