"use client";

import { useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";

// Повний текст анонсу гри (той самий, що бот постить у Телеграм).
// Довгий двомовний текст → згортка «Показати повністю / Згорнути».
export default function AnnouncementBlock({ text, lang }: { text: string; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const collapsible = text.length > 280; // ~6+ рядків

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {st(lang, "games_announce_heading")}
      </h4>
      <div
        className={`whitespace-pre-line text-sm text-gray-600 ${
          collapsible && !open ? "max-h-40 overflow-hidden" : ""
        }`}
      >
        {text}
      </div>
      {collapsible && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-xs font-medium text-brand hover:underline"
        >
          {st(lang, open ? "games_show_less" : "games_show_more")}
        </button>
      )}
    </div>
  );
}
