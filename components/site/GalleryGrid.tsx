"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GalleryPhoto } from "@/lib/site-data";

// Мозаїка різнорозмірних плиток, що складається в ЧІТКИЙ прямокутник:
//  • патерн «одна 2×2 + решта 1×1» на кожен блок cols×2 рівно замощує блок (для cols ≥ 3),
//    тож при кратній к-ті плиток прямокутник без дір; зайве по краях — обрізаємо (object-cover);
//  • висота обмежена MAX_ROWS рядами → блок стандартного розміру, не росте;
//  • надлишок фото крутиться: випадкова плитка плавно змінює фото на ще не показане;
//  • лайтбокс зі стрілками ‹ › гортає ВСІ фото (клавіші ←/→, Esc — закрити).

const MAX_ROWS = 4; // парне (плитка 2×2 = 2 ряди) → фіксована висота
const GAP = 8; // px, = gap-2
const ROTATE_MS = 3500;

function colsForWidth(w: number): number {
  if (w < 500) return 3;
  if (w < 760) return 4;
  if (w < 1024) return 5;
  return 6;
}

export default function GalleryGrid({
  photos,
  closeLabel,
}: {
  photos: GalleryPhoto[];
  closeLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [idx, setIdx] = useState<number | null>(null); // індекс у photos для лайтбокса

  // Вимір ширини контейнера → кількість колонок і розмір базової (квадратної) плитки.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { cols, autoRow, count, unit } = useMemo(() => {
    const w = width || 1024;
    const c = colsForWidth(w);
    const colW = Math.max(60, Math.floor((w - GAP * (c - 1)) / c));
    const u = 2 * c - 3; // фото на блок cols×2 (1 з них — велика 2×2)
    const capacity = (MAX_ROWS / 2) * u;
    const full = Math.floor(photos.length / u) * u; // кратно блоку → без дір
    const cnt = Math.min(full || photos.length, capacity);
    return { cols: c, autoRow: colW, count: cnt, unit: u };
  }, [width, photos.length]);

  // Фото у слотах (велика/мала визначається позицією: перша в кожному блоці — велика).
  const [slotPhotos, setSlotPhotos] = useState<GalleryPhoto[]>([]);
  useEffect(() => {
    setSlotPhotos(photos.slice(0, count));
  }, [photos, count]);

  const overflow = photos.length > count;

  // Ротація надлишку (пауза, коли відкрито лайтбокс).
  useEffect(() => {
    if (!overflow || idx !== null) return;
    const id = setInterval(() => {
      setSlotPhotos((cur) => {
        if (!cur.length) return cur;
        const shown = new Set(cur.map((p) => p.id));
        const pool = photos.filter((p) => !shown.has(p.id));
        if (!pool.length) return cur;
        const i = Math.floor(Math.random() * cur.length);
        const copy = cur.slice();
        copy[i] = pool[Math.floor(Math.random() * pool.length)];
        return copy;
      });
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [overflow, idx, photos]);

  const close = useCallback(() => setIdx(null), []);
  const go = useCallback(
    (d: number) =>
      setIdx((cur) => (cur === null ? cur : (cur + d + photos.length) % photos.length)),
    [photos.length],
  );

  // Клавіатура для лайтбокса.
  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [idx, close, go]);

  const openTile = (photo: GalleryPhoto) => {
    const i = photos.findIndex((p) => p.id === photo.id);
    setIdx(i < 0 ? 0 : i);
  };

  const activePhoto = idx === null ? null : photos[idx];

  return (
    <>
      <div ref={wrapRef} className="w-full">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridAutoRows: `${autoRow}px`,
            gridAutoFlow: "dense",
          }}
        >
          {slotPhotos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openTile(p)}
              className={`group overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                i % unit === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={p.id}
                src={p.url}
                alt={p.caption ?? ""}
                loading="lazy"
                style={{ animation: "rxFade 0.6s ease both" }}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
        >
          <button
            type="button"
            aria-label="prev"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-neutral-50 hover:bg-white/20 sm:left-4"
          >
            ‹
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activePhoto.url}
            alt={activePhoto.caption ?? ""}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[88vw] object-contain"
          />

          <button
            type="button"
            aria-label="next"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-neutral-50 hover:bg-white/20 sm:right-4"
          >
            ›
          </button>

          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-neutral-50 hover:bg-white/20"
          >
            {closeLabel}
          </button>

          {activePhoto.caption && (
            <p className="absolute inset-x-0 bottom-4 mx-auto max-w-2xl px-4 text-center text-sm text-neutral-50">
              {activePhoto.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
