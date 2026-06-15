"use client";

import { useEffect, useState } from "react";
import type { GalleryPhoto } from "@/lib/site-data";

// Масонрі-галерея (CSS-колонки): плитки різної висоти щільно пакуються в колонки
// без внутрішніх дір → блок максимально заповнений. + простий лайтбокс (клік → fullscreen,
// Esc/клік по тлу закриває). Звичайний <img> (URL зі Supabase Storage).
export default function GalleryGrid({
  photos,
  closeLabel,
}: {
  photos: GalleryPhoto[];
  closeLabel: string;
}) {
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      <div className="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(p)}
            className="group mb-2 block w-full break-inside-avoid overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:mb-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.caption ?? ""}
              loading="lazy"
              className="w-full transition duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.caption ?? ""}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
          {active.caption && (
            <p className="max-w-2xl text-center text-sm text-neutral-50">{active.caption}</p>
          )}
          <button
            type="button"
            onClick={() => setActive(null)}
            className="rounded-md bg-white/10 px-4 py-1.5 text-sm font-medium text-neutral-50 hover:bg-white/20"
          >
            {closeLabel}
          </button>
        </div>
      )}
    </>
  );
}
