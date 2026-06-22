"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { st, type Lang } from "@/lib/site-i18n";
import { registerForGame } from "@/app/cabinet/actions";
import { ui, btn } from "@/components/ui";
import type { RegisterMapDriver } from "@/components/site/RegisterCarpoolMap";

// Leaflet чіпає window на імпорті → вантажимо мапу лише на клієнті (форма вже "use client").
const RegisterCarpoolMap = dynamic(() => import("@/components/site/RegisterCarpoolMap"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse bg-gray-100" />,
});

type Carpool = {
  venue: { name: string | null; lat: number; lng: number; radiusM: number } | null;
  drivers: RegisterMapDriver[];
};

// Форма запису на гру: оренда + транспорт. Для own/need одразу показуємо мапу гри:
//  own  → клік ставить точку виїзду (зберігається при сабміті); + місця та ціна;
//  need → перегляд активних водіїв (бронювання — далі на /carpool).
export default function RegisterForm({
  gameId,
  lang,
  returnTo,
}: {
  gameId: number;
  lang: Lang;
  returnTo?: string;
}) {
  const [transport, setTransport] = useState<"need" | "own" | "skip">("skip");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [carpool, setCarpool] = useState<Carpool | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const inputCls = ui.input;
  const showMap = transport === "own" || transport === "need";

  // Вантажимо полігон + активних водіїв, коли обрано транспорт (один раз на форму).
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

  return (
    <form action={registerForGame} className="space-y-3">
      <input type="hidden" name="gameId" value={gameId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {/* Точка виїзду водія (обрана на мапі). Порожньо → поставить пізніше на /carpool. */}
      <input type="hidden" name="from_lat" value={pin?.lat ?? ""} />
      <input type="hidden" name="from_lng" value={pin?.lng ?? ""} />

      <label className="flex min-h-[44px] items-center gap-3 text-sm text-gray-700">
        <input type="checkbox" name="needs_rental" className={ui.checkbox} />
        {st(lang, "reg_rental_q")}
      </label>

      <fieldset className="space-y-1">
        <legend className="text-sm text-gray-500">{st(lang, "reg_transport_q")}</legend>
        <label className="flex min-h-[44px] items-center gap-3 text-sm text-gray-700">
          <input
            type="radio"
            name="transport"
            value="need"
            checked={transport === "need"}
            onChange={() => setTransport("need")}
            className={ui.radio}
          />
          {st(lang, "reg_transport_need")}
        </label>
        <label className="flex min-h-[44px] items-center gap-3 text-sm text-gray-700">
          <input
            type="radio"
            name="transport"
            value="own"
            checked={transport === "own"}
            onChange={() => setTransport("own")}
            className={ui.radio}
          />
          {st(lang, "reg_transport_own")}
        </label>
        <label className="flex min-h-[44px] items-center gap-3 text-sm text-gray-700">
          <input
            type="radio"
            name="transport"
            value="skip"
            checked={transport === "skip"}
            onChange={() => setTransport("skip")}
            className={ui.radio}
          />
          {st(lang, "reg_transport_skip")}
        </label>
      </fieldset>

      {showMap && (
        <div className="space-y-1">
          <p className={`text-xs ${ui.metaFaint}`}>
            {st(lang, transport === "own" ? "reg_map_own_hint" : "reg_map_need_hint")}
          </p>
          {carpool ? (
            <RegisterCarpoolMap
              lang={lang}
              mode={transport === "own" ? "own" : "need"}
              venue={carpool.venue}
              drivers={carpool.drivers}
              pin={pin}
              onPick={(lat, lng) => setPin({ lat, lng })}
            />
          ) : loadFailed ? (
            <p className={`text-xs ${ui.warnText}`}>{st(lang, "carpool_err_generic")}</p>
          ) : (
            <div className="h-72 w-full animate-pulse bg-gray-100" />
          )}
        </div>
      )}

      {transport === "own" && (
        <div className="space-y-2">
          <input
            name="free_seats"
            type="number"
            min={0}
            max={8}
            placeholder={st(lang, "reg_seats_ph")}
            className={inputCls}
          />
          <input
            name="ride_price"
            type="number"
            min={0}
            max={1000}
            required
            placeholder={st(lang, "reg_price_ph")}
            className={inputCls}
          />
        </div>
      )}

      <button type="submit" className={`${btn("action")} w-full sm:w-auto`}>
        {st(lang, "btn_register")}
      </button>
    </form>
  );
}
