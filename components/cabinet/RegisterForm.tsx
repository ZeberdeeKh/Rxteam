"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { st, type Lang } from "@/lib/site-i18n";
import { registerForGame } from "@/app/cabinet/actions";
import { ui, btn } from "@/components/ui";
import type { RegisterMapDriver } from "@/components/site/RegisterCarpoolMap";

const RegisterCarpoolMap = dynamic(() => import("@/components/site/RegisterCarpoolMap"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse bg-gray-100" />,
});

type Pt = { lat: number; lng: number };
type Carpool = {
  venue: { name: string | null; lat: number; lng: number; radiusM: number } | null;
  drivers: RegisterMapDriver[];
};

// Початкове оголошення для режиму редагування (із getCabinetGames).
export type RegisterInitial = {
  transport: "own" | "need" | null;
  freeSeats: number | null;
  ridePrice: number | null;
  fromLat: number | null;
  fromLng: number | null;
  pickups: Pt[];
  seatsClosed: boolean;
};

// Форма запису/редагування поїздки. Для own — повний редактор у мапі (виїзд + до 4 зупинок +
// маршрут), місця, ціна, «набір закрито». Для need — перегляд активних водіїв. Сабміт = upsert.
export default function RegisterForm({
  gameId,
  lang,
  returnTo,
  initial,
  editing = false,
}: {
  gameId: number;
  lang: Lang;
  returnTo?: string;
  initial?: RegisterInitial;
  editing?: boolean;
}) {
  const [transport, setTransport] = useState<"need" | "own" | "skip">(initial?.transport ?? "skip");
  const [pin, setPin] = useState<Pt | null>(
    initial?.fromLat != null && initial?.fromLng != null
      ? { lat: initial.fromLat, lng: initial.fromLng }
      : null,
  );
  const [pickups, setPickups] = useState<Pt[]>(initial?.pickups ?? []);
  const [editMode, setEditMode] = useState<"departure" | "pickup">("departure");
  const [seats, setSeats] = useState<number>(initial?.freeSeats ?? 1);
  const [price, setPrice] = useState<string>(initial?.ridePrice != null ? String(initial.ridePrice) : "");
  const [showHelp, setShowHelp] = useState(false);
  const [carpool, setCarpool] = useState<Carpool | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const inputCls = ui.input;
  const showMap = transport === "own" || transport === "need";

  // Полігон + активні водії для мапи (один раз на форму, коли потрібна мапа).
  useEffect(() => {
    if (!showMap || carpool || loadFailed) return;
    let cancelled = false;
    fetch(`/api/carpool/${gameId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d) => {
        if (!cancelled) setCarpool(d as Carpool);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [showMap, carpool, loadFailed, gameId]);

  // Клік по мапі: у режимі «виїзд» — точка виїзду; у режимі «підбір» — зупинка (до 4).
  function onPick(lat: number, lng: number) {
    if (editMode === "departure") setPin({ lat, lng });
    else setPickups((cur) => (cur.length >= 4 ? cur : [...cur, { lat, lng }]));
  }

  return (
    <form action={registerForGame} className="space-y-3">
      <input type="hidden" name="gameId" value={gameId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <input type="hidden" name="from_lat" value={pin?.lat ?? ""} />
      <input type="hidden" name="from_lng" value={pin?.lng ?? ""} />
      <input type="hidden" name="pickups" value={JSON.stringify(pickups)} />

      <label className="flex min-h-[44px] items-center gap-3 text-sm text-gray-700">
        <input type="checkbox" name="needs_rental" className={ui.checkbox} />
        {st(lang, "reg_rental_q")}
      </label>

      <fieldset className="space-y-1">
        <legend className="text-sm text-gray-500">{st(lang, "reg_transport_q")}</legend>
        {(["need", "own", "skip"] as const).map((t) => (
          <label key={t} className="flex min-h-[44px] items-center gap-3 text-sm text-gray-700">
            <input
              type="radio"
              name="transport"
              value={t}
              checked={transport === t}
              onChange={() => setTransport(t)}
              className={ui.radio}
            />
            {st(lang, t === "need" ? "reg_transport_need" : t === "own" ? "reg_transport_own" : "reg_transport_skip")}
          </label>
        ))}
      </fieldset>

      {showMap && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <p className={`text-xs ${ui.metaFaint}`}>
              {st(lang, transport === "own" ? "reg_map_own_hint" : "reg_map_need_hint")}
            </p>
            <button
              type="button"
              onClick={() => setShowHelp((h) => !h)}
              aria-label={st(lang, "carpool_how_title")}
              className="shrink-0 text-sm text-[var(--c-brand-text)]"
            >
              ⓘ
            </button>
          </div>
          {showHelp && (
            <div className={`${ui.panel} space-y-1`}>
              <p className="text-sm font-semibold text-gray-700">{st(lang, "carpool_how_title")}</p>
              <ul className="list-disc space-y-0.5 pl-5 text-xs text-gray-600">
                <li>{st(lang, "carpool_how_1")}</li>
                <li>{st(lang, "carpool_how_2")}</li>
                <li>{st(lang, "carpool_how_3")}</li>
              </ul>
            </div>
          )}

          {/* Перемикач: точка виїзду / зупинка (лише водій) */}
          {transport === "own" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditMode("departure")}
                className={btn(editMode === "departure" ? "action" : "outline", "sm")}
              >
                {st(lang, "carpool_mode_departure")}
              </button>
              <button
                type="button"
                onClick={() => setEditMode("pickup")}
                className={btn(editMode === "pickup" ? "action" : "outline", "sm")}
              >
                {st(lang, "carpool_mode_pickup", { n: pickups.length })}
              </button>
              {pickups.length > 0 &&
                pickups.map((_, i) => (
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

          {carpool ? (
            <RegisterCarpoolMap
              lang={lang}
              mode={transport === "own" ? "own" : "need"}
              venue={carpool.venue}
              drivers={carpool.drivers}
              pin={pin}
              pickups={pickups}
              onPick={onPick}
            />
          ) : loadFailed ? (
            <p className={`text-xs ${ui.warnText}`}>{st(lang, "carpool_err_generic")}</p>
          ) : (
            <div className="h-80 w-full animate-pulse bg-gray-100" />
          )}
        </div>
      )}

      {transport === "own" && (
        <div className="space-y-2">
          {/* Місця: степер ±; 0 = набір закрито (окремого чекбокса «закрити» немає). */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{st(lang, "reg_seats_label")}</span>
            <button
              type="button"
              onClick={() => setSeats((s) => Math.max(0, s - 1))}
              className={btn("outline", "sm")}
              aria-label="-1"
            >
              −
            </button>
            <span className="min-w-[2ch] text-center text-sm font-semibold text-gray-800">{seats}</span>
            <button
              type="button"
              onClick={() => setSeats((s) => Math.min(8, s + 1))}
              className={btn("outline", "sm")}
              aria-label="+1"
            >
              +
            </button>
            {seats === 0 && (
              <span className={`text-xs ${ui.warnText}`}>{st(lang, "carpool_seats_closed")}</span>
            )}
          </div>
          <input type="hidden" name="free_seats" value={seats} />
          <input
            name="ride_price"
            type="number"
            min={0}
            max={1000}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={st(lang, "reg_price_ph")}
            className={inputCls}
          />
        </div>
      )}

      <button type="submit" className={`${btn("action")} w-full sm:w-auto`}>
        {st(lang, editing ? "btn_save" : "btn_register")}
      </button>
    </form>
  );
}
