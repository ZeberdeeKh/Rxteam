"use client";

import { useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import { st, type Lang } from "@/lib/site-i18n";
import { setDeparturePoint } from "@/app/carpool/actions";
import SetDeparturePinButton from "@/components/site/SetDeparturePinButton";
import { btn, ui } from "@/components/ui";

export type CarpoolMapDriver = {
  playerId: number;
  label: string;
  fromPlace: string | null;
  freeSeats: number;
  seatsClosed: boolean;
  lat: number;
  lng: number;
  isMe: boolean;
};

export type CarpoolMapProps = {
  lang: Lang;
  gameId: number;
  venue: { name: string | null; lat: number; lng: number; radiusM: number } | null;
  drivers: CarpoolMapDriver[];
  canSetPin: boolean;
  myPin: { lat: number; lng: number } | null;
};

// Брендові квадратні маркери (divIcon) — заодно обходять баг дефолтних ассетів Leaflet у бандлері.
function pinIcon(emoji: string, border: string, bg: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:2px solid ${border};background:${bg};font-size:15px;line-height:1">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

// Клік по мапі → чернетка точки виїзду (лише коли водій її ставить).
function ClickToDraft({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function CarpoolMap({ lang, gameId, venue, drivers, canSetPin, myPin }: CarpoolMapProps) {
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);

  const venueIcon = useMemo(() => pinIcon("🎯", "#111", "#fff"), []);
  const driverIcon = useMemo(() => pinIcon("🚗", "#b45309", "#f6921e"), []);
  const meIcon = useMemo(() => pinIcon("🚙", "#111", "#fde68a"), []);
  const draftIcon = useMemo(() => pinIcon("📍", "#111", "#fff"), []);

  // Центр: полігон → перший водій → Вроцлав.
  const center: [number, number] = venue
    ? [venue.lat, venue.lng]
    : drivers[0]
      ? [drivers[0].lat, drivers[0].lng]
      : [51.107, 17.038];

  return (
    <div>
      {canSetPin && (
        <div className={`mb-3 ${ui.fieldBox}`}>
          <p className={`mb-2 ${ui.body}`}>
            {myPin ? st(lang, "carpool_pin_set") : st(lang, "carpool_pin_hint")}
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <SetDeparturePinButton gameId={gameId} lang={lang} />
            {draft && (
              <form action={setDeparturePoint}>
                <input type="hidden" name="gameId" value={gameId} />
                <input type="hidden" name="lat" value={draft.lat} />
                <input type="hidden" name="lng" value={draft.lng} />
                <button type="submit" className={btn("action")}>
                  {st(lang, "carpool_save_pin")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="h-[60vh] min-h-[320px] w-full overflow-hidden border border-gray-200">
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

          {drivers.map((d) => (
            <Marker key={d.playerId} position={[d.lat, d.lng]} icon={d.isMe ? meIcon : driverIcon}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">
                    {d.label}
                    {d.isMe ? ` ${st(lang, "carpool_you")}` : ""}
                  </p>
                  {d.fromPlace && <p>{d.fromPlace}</p>}
                  <p>
                    {d.seatsClosed
                      ? st(lang, "carpool_seats_closed")
                      : st(lang, "carpool_seats_free", { n: d.freeSeats })}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {draft && <Marker position={[draft.lat, draft.lng]} icon={draftIcon} />}
          {canSetPin && <ClickToDraft onPick={(lat, lng) => setDraft({ lat, lng })} />}
        </MapContainer>
      </div>
    </div>
  );
}
