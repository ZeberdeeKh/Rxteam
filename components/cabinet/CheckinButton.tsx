"use client";

import { useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import { webCheckin } from "@/app/cabinet/actions";
import { buttonClass, ui } from "@/components/ui";

// Веб-чек-ін: бере геолокацію браузера → кладе lat/lng у форму → сабмітить серверну дію.
export default function CheckinButton({ gameId, lang }: { gameId: number; lang: Lang }) {
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
    <form action={webCheckin}>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="lat" />
      <input type="hidden" name="lng" />
      <button
        type="submit"
        onClick={onClick}
        disabled={status === "locating"}
        className={buttonClass("primary", "md")}
      >
        {status === "locating" ? st(lang, "checkin_locating") : st(lang, "web_checkin_btn")}
      </button>
      {status === "error" && (
        <p className={`mt-1 text-xs ${ui.negText}`}>{st(lang, "checkin_geo_err")}</p>
      )}
    </form>
  );
}
