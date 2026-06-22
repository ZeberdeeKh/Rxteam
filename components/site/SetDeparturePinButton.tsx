"use client";

import { useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import { setDeparturePoint } from "@/app/carpool/actions";
import { btn, ui } from "@/components/ui";

// «Моя GPS» для точки виїзду: бере геолокацію браузера → кладе lat/lng у форму → сабмітить
// серверну дію setDeparturePoint. Той самий патерн, що CheckinButton (веб-чек-ін).
export default function SetDeparturePinButton({ gameId, lang }: { gameId: number; lang: Lang }) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form || !("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        (form.elements.namedItem("lat") as HTMLInputElement).value = String(pos.coords.latitude);
        (form.elements.namedItem("lng") as HTMLInputElement).value = String(pos.coords.longitude);
        form.requestSubmit();
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <form action={setDeparturePoint} className="w-full sm:w-auto">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="lat" />
      <input type="hidden" name="lng" />
      <button
        type="submit"
        onClick={onClick}
        disabled={status === "locating"}
        className={`${btn("outline")} w-full sm:w-auto`}
      >
        {status === "locating" ? st(lang, "carpool_locating") : st(lang, "carpool_use_location")}
      </button>
      {status === "error" && (
        <p className={`mt-1 text-xs ${ui.negText}`}>{st(lang, "carpool_geo_err")}</p>
      )}
    </form>
  );
}
