"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryPhoto } from "@/lib/site-data";

// Фото-вол фіксованого («стандартного») розміру:
//  • колонки рахуються з виміряної ширини І кількості фото — більше фото означає дрібніші
//    плитки, але не дрібніше за TILE_MIN;
//  • висота обмежена MAX_ROWS рядами → блок не росте вгору, лишається прямокутником;
//  • коли фото більше за місткість, зайві крутяться: випадкова плитка плавно змінює фото
//    на ще не показане (кожні ROTATE_MS).
// + простий лайтбокс (клік → fullscreen, Esc/клік по тлу закриває).

const MAX_ROWS = 3; // макс. рядів → фіксована висота прямокутника
const TILE_MIN = 104; // px — найдрібніша плитка (далі вмикається ротація)
const TILE_MAX = 200; // px — найбільша плитка (коли фото мало)
const GAP = 8; // px — відступ між плитками (gap-2)
const ROTATE_MS = 3500; // інтервал підміни фото при надлишку

export default function GalleryGrid({
  photos,
  closeLabel,
}: {
  photos: GalleryPhoto[];
  closeLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  // Вимірюємо ширину контейнера (від неї залежить кількість колонок).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const total = photos.length;

  // Колонки: у межах [TILE_MIN, TILE_MAX] за шириною, але не більше, ніж треба для MAX_ROWS рядів.
  const { cols, capacity } = useMemo(() => {
    const w = width || 960;
    const colMin = Math.max(2, Math.floor((w + GAP) / (TILE_MAX + GAP))); // найбільші плитки
    const colMax = Math.max(colMin, Math.floor((w + GAP) / (TILE_MIN + GAP))); // найдрібніші
    const colsForCount = Math.max(1, Math.ceil(total / MAX_ROWS));
    const c = Math.min(colMax, Math.max(colMin, colsForCount));
    return { cols: c, capacity: c * MAX_ROWS };
  }, [width, total]);

  const overflow = total > capacity;

  // Скільки плиток статично (лише повні ряди → прямокутник без дір).
  const baseCount = useMemo(() => {
    if (overflow) return capacity;
    if (total < cols) return total; // мало фото — один (неповний) ряд
    return Math.floor(total / cols) * cols; // повні ряди
  }, [overflow, capacity, total, cols]);

  // Поточні фото у слотах.
  const [slots, setSlots] = useState<GalleryPhoto[]>([]);
  useEffect(() => {
    setSlots(photos.slice(0, baseCount));
  }, [photos, baseCount]);

  // Ротація надлишку: кожні ROTATE_MS міняємо випадкову плитку на ще не показане фото.
  useEffect(() => {
    if (!overflow) return;
    const id = setInterval(() => {
      setSlots((cur) => {
        if (!cur.length) return cur;
        const shown = new Set(cur.map((p) => p.id));
        const pool = photos.filter((p) => !shown.has(p.id));
        if (!pool.length) return cur;
        const i = Math.floor(Math.random() * cur.length);
        const next = pool[Math.floor(Math.random() * pool.length)];
        const copy = cur.slice();
        copy[i] = next;
        return copy;
      });
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [overflow, photos]);

  // Esc + блокування скролу для лайтбокса.
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
      <div ref={wrapRef} className="w-full">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {slots.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(p)}
              className="group block aspect-square overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
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
            className="max-h-[85vh] max-w-full object-contain"
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
