"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from "react-leaflet";
import { st, type Lang } from "@/lib/site-i18n";
import { setDeparturePoint, savePickups } from "@/app/carpool/actions";
import SetDeparturePinButton from "@/components/site/SetDeparturePinButton";
import { btn, ui } from "@/components/ui";

type Pt = { lat: number; lng: number };

export type CarpoolMapDriver = {
  playerId: number;
  label: string;
  fromPlace: string | null;
  ridePrice: number | null;
  rideNote: string | null;
  freeSeats: number;
  seatsClosed: boolean;
  lat: number;
  lng: number;
  pickups: Pt[];
  isMe: boolean;
};

export type CarpoolMapProps = {
  lang: Lang;
  gameId: number;
  venue: { name: string | null; lat: number; lng: number; radiusM: number } | null;
  drivers: CarpoolMapDriver[];
  canSetPin: boolean;
  myPin: Pt | null;
  myPickups: Pt[];
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

// Нумерований кружечок для точок підбору.
function pickupIcon(n: number) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:2px solid #b45309;background:#fff;color:#b45309;font-size:11px;font-weight:700;border-radius:9999px">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Маршрут по дорогах через OSRM (без ключа); при недоступності — пряма ламана через точки.
function DriverRoute({
  from,
  via,
  to,
  weight,
}: {
  from: [number, number];
  via: [number, number][];
  to: [number, number];
  weight: number;
}) {
  const straight = useMemo<[number, number][]>(() => [from, ...via, to], [from, via, to]);
  const [geo, setGeo] = useState<[number, number][] | null>(null);
  const key = JSON.stringify(straight);

  useEffect(() => {
    let cancelled = false;
    const path = straight.map((p) => `${p[1]},${p[0]}`).join(";"); // OSRM хоче lon,lat
    fetch(`https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("osrm"))))
      .then((j) => {
        const g = j?.routes?.[0]?.geometry?.coordinates;
        if (!cancelled && Array.isArray(g)) {
          setGeo(g.map((c: number[]) => [c[1], c[0]] as [number, number]));
        }
      })
      .catch(() => {
        if (!cancelled) setGeo(null); // лишаємось на прямій ламаній
      });
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Polyline positions={geo ?? straight} pathOptions={{ color: "#f6921e", weight, opacity: 0.6 }} />;
}

// Ловить клік по мапі (лише коли водій редагує): режим вирішує — виїзд чи точка підбору.
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function CarpoolMap({
  lang,
  gameId,
  venue,
  drivers,
  canSetPin,
  myPin,
  myPickups,
}: CarpoolMapProps) {
  const [draft, setDraft] = useState<Pt | null>(null);
  const [mode, setMode] = useState<"departure" | "pickup">("departure");
  const [pickups, setPickups] = useState<Pt[]>(() => myPickups.slice(0, 4));

  const venueIcon = useMemo(() => pinIcon("🎯", "#111", "#fff"), []);
  const driverIcon = useMemo(() => pinIcon("🚗", "#b45309", "#f6921e"), []);
  const meIcon = useMemo(() => pinIcon("🚙", "#111", "#fde68a"), []);
  const draftIcon = useMemo(() => pinIcon("📍", "#111", "#fff"), []);

  const center: [number, number] = venue
    ? [venue.lat, venue.lng]
    : drivers[0]
      ? [drivers[0].lat, drivers[0].lng]
      : [51.107, 17.038];

  // Клік: у режимі виїзду — чернетка піна; у режимі підбору — додаємо точку (до 4).
  function onPick(lat: number, lng: number) {
    if (mode === "departure") setDraft({ lat, lng });
    else setPickups((cur) => (cur.length >= 4 ? cur : [...cur, { lat, lng }]));
  }

  // Водіїв, чий маршрут/точки малюємо як «чужі» (свого, що редагуємо, малюємо окремо — наживо).
  const otherDrivers = drivers.filter((d) => !(d.isMe && canSetPin));
  const myStart: [number, number] | null = draft
    ? [draft.lat, draft.lng]
    : myPin
      ? [myPin.lat, myPin.lng]
      : null;

  return (
    <div>
      {canSetPin && (
        <div className={`mb-3 space-y-3 ${ui.fieldBox}`}>
          <div>
            <p className={`mb-2 ${ui.body}`}>
              {myStart ? st(lang, "carpool_pin_set") : st(lang, "carpool_pin_hint")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("departure")}
                className={btn(mode === "departure" ? "action" : "outline", "sm")}
              >
                {st(lang, "carpool_mode_departure")}
              </button>
              <button
                type="button"
                onClick={() => setMode("pickup")}
                className={btn(mode === "pickup" ? "action" : "outline", "sm")}
              >
                {st(lang, "carpool_mode_pickup", { n: pickups.length })}
              </button>
            </div>
          </div>

          {/* Зберегти точку виїзду (чернетка) + «моя GPS» */}
          <div className="flex flex-wrap items-start gap-2">
            <SetDeparturePinButton gameId={gameId} lang={lang} />
            {draft && (
              <form action={setDeparturePoint}>
                <input type="hidden" name="gameId" value={gameId} />
                <input type="hidden" name="lat" value={draft.lat} />
                <input type="hidden" name="lng" value={draft.lng} />
                <button type="submit" className={btn("action", "sm")}>
                  {st(lang, "carpool_save_pin")}
                </button>
              </form>
            )}
          </div>

          {/* Точки підбору (до 4): додаються кліком у режимі «Підбір»; чипи — для видалення. */}
          <div>
            <p className={`mb-1 ${ui.meta}`}>{st(lang, "carpool_pickups_hint")}</p>
            {pickups.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {pickups.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPickups((cur) => cur.filter((_, j) => j !== i))}
                    className="inline-flex items-center gap-1 border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:border-[var(--c-danger-solid)]"
                  >
                    {i + 1} ✕
                  </button>
                ))}
              </div>
            )}
            <form action={savePickups}>
              <input type="hidden" name="gameId" value={gameId} />
              <input type="hidden" name="pickups" value={JSON.stringify(pickups)} />
              <button type="submit" className={btn("outline", "sm")}>
                {st(lang, "carpool_save_pickups")}
              </button>
            </form>
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

          {/* Чужі водії: пін + маршрут (виїзд → точки підбору → полігон) + точки підбору */}
          {otherDrivers.map((d) => (
            <Marker key={d.playerId} position={[d.lat, d.lng]} icon={d.isMe ? meIcon : driverIcon}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">
                    {d.label}
                    {d.isMe ? ` ${st(lang, "carpool_you")}` : ""}
                  </p>
                  {d.fromPlace && <p>{d.fromPlace}</p>}
                  {d.ridePrice != null && <p>{st(lang, "carpool_price", { price: d.ridePrice })}</p>}
                  <p>
                    {d.seatsClosed
                      ? st(lang, "carpool_seats_closed")
                      : st(lang, "carpool_seats_free", { n: d.freeSeats })}
                  </p>
                  {d.rideNote && <p className="italic">“{d.rideNote}”</p>}
                </div>
              </Popup>
            </Marker>
          ))}
          {venue &&
            otherDrivers.map((d) => (
              <DriverRoute
                key={`route-${d.playerId}`}
                from={[d.lat, d.lng]}
                via={d.pickups.map((p) => [p.lat, p.lng] as [number, number])}
                to={[venue.lat, venue.lng]}
                weight={3}
              />
            ))}
          {otherDrivers.flatMap((d) =>
            d.pickups.map((p, i) => (
              <Marker key={`pk-${d.playerId}-${i}`} position={[p.lat, p.lng]} icon={pickupIcon(i + 1)} />
            )),
          )}

          {/* Я-водій (редагування): чернетка/збережений виїзд + точки підбору + живий маршрут */}
          {canSetPin && myStart && <Marker position={myStart} icon={draft ? draftIcon : meIcon} />}
          {canSetPin &&
            pickups.map((p, i) => (
              <Marker key={`mine-pk-${i}`} position={[p.lat, p.lng]} icon={pickupIcon(i + 1)} />
            ))}
          {canSetPin && venue && myStart && (
            <DriverRoute
              from={myStart}
              via={pickups.map((p) => [p.lat, p.lng] as [number, number])}
              to={[venue.lat, venue.lng]}
              weight={4}
            />
          )}

          {canSetPin && <ClickHandler onPick={onPick} />}
        </MapContainer>
      </div>
    </div>
  );
}
