"use client";

import { useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import { webCheckin } from "@/app/cabinet/actions";

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
        className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {status === "locating" ? st(lang, "checkin_locating") : st(lang, "web_checkin_btn")}
      </button>
      {status === "error" && (
        <p className="mt-1 text-xs text-red-600">{st(lang, "checkin_geo_err")}</p>
      )}
    </form>
  );
}
