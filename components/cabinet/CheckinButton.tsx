"use client";

import { useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import { webCheckin } from "@/app/cabinet/actions";
import { btn, ui } from "@/components/ui";

// Веб-чек-ін: бере геолокацію браузера → кладе lat/lng у форму → сабмітить серверну дію.
// returnTo — куди повернути після чек-іну (/cabinet за дефолтом або /games).
export default function CheckinButton({
  gameId,
  lang,
  returnTo,
}: {
  gameId: number;
  lang: Lang;
  returnTo?: string;
}) {
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
    <form action={webCheckin} className="w-full sm:w-auto">
      <input type="hidden" name="gameId" value={gameId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <input type="hidden" name="lat" />
      <input type="hidden" name="lng" />
      <button
        type="submit"
        onClick={onClick}
        disabled={status === "locating"}
        className={`${btn("action")} w-full sm:w-auto`}
      >
        {status === "locating" ? st(lang, "checkin_locating") : st(lang, "web_checkin_btn")}
      </button>
      {status === "error" && (
        <p className={`mt-1 text-xs ${ui.negText}`}>{st(lang, "checkin_geo_err")}</p>
      )}
    </form>
  );
}
