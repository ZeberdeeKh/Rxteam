"use client";

import { useState } from "react";
import { btn } from "@/components/ui";

// Кнопка «Поділитися профілем»: на мобільному — нативний шер-лист (navigator.share),
// на десктопі — копіює посилання на публічну картку /u/<callsign> у буфер обміну.
// URL будуємо з window.location.origin, тож не залежимо від site_url.
export default function ShareProfileButton({
  callsign,
  shareLabel,
  copiedLabel,
}: {
  callsign: string;
  shareLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = `${window.location.origin}/u/${encodeURIComponent(callsign)}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        /* користувач скасував — нічого не робимо */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступний — тихо ігноруємо */
    }
  }

  return (
    <button type="button" onClick={onShare} className={btn("outline", "sm")}>
      {copied ? copiedLabel : shareLabel}
    </button>
  );
}
