"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ui } from "@/components/ui";
import type { GalleryPhoto } from "@/lib/site-data";

// Різнорозмірна мозаїка, що складається в ЧІТКИЙ прямокутник cols×ROWS:
//  • розкладка — жадібне укладання за висотою колонок: завжди кладемо плитку в найнижчу
//    рівну ділянку → сітка заповнюється повністю, без дір (плитки 1–3 завширшки, 1–2 заввишки);
//  • фіксована висота ROWS рядів → блок «трьохповерховий», стандартного розміру;
//  • фото кропляться під клітинку (object-cover);
//  • надлишок фото крутиться (випадкова плитка плавно змінює фото на ще не показане);
//  • лайтбокс зі стрілками ‹ › гортає ВСІ фото (клавіші ←/→, Esc — закрити).

const ROWS = 3; // «трьохповерхова» — фіксована висота
const GAP = 8; // px, = gap-2
const ROTATE_MS = 3500;
const WIDTHS = [1, 1, 1, 2, 2, 3]; // ваги ширини плитки (більше дрібних)
const HEIGHTS = [1, 1, 2]; // ваги висоти

type Tile = { c: number; r: number; w: number; h: number };

function colsForWidth(w: number): number {
  if (w < 500) return 3;
  if (w < 760) return 4;
  if (w < 1024) return 5;
  return 6;
}

// Жадібне укладання у прямокутник cols×rows без дір (плитки різних розмірів).
function buildLayout(cols: number, rows: number): Tile[] {
  const heights = new Array<number>(cols).fill(0);
  const tiles: Tile[] = [];
  let guard = 0;
  while (guard++ < 4000) {
    let minH = Infinity;
    for (const h of heights) if (h < minH) minH = h;
    if (minH >= rows) break;
    const c = heights.indexOf(minH);
    let run = 1; // довжина рівної (однакової висоти) ділянки від c
    while (c + run < cols && heights[c + run] === minH) run++;
    const remaining = rows - minH;
    const hOpts = HEIGHTS.filter((h) => h <= Math.min(2, remaining));
    const h = hOpts[Math.floor(Math.random() * hOpts.length)];
    const wOpts = WIDTHS.filter((w) => w <= Math.min(run, 3));
    const w = wOpts[Math.floor(Math.random() * wOpts.length)];
    tiles.push({ c, r: minH, w, h });
    for (let k = c; k < c + w; k++) heights[k] += h;
  }
  return tiles;
}

export default function GalleryGrid({
  photos,
  closeLabel,
  prevLabel,
  nextLabel,
}: {
  photos: GalleryPhoto[];
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [idx, setIdx] = useState<number | null>(null); // індекс у photos для лайтбокса

  // Вимір ширини контейнера.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cols = useMemo(() => colsForWidth(width || 1024), [width]);
  const colW = useMemo(
    () => Math.max(60, Math.floor(((width || 1024) - GAP * (cols - 1)) / cols)),
    [width, cols],
  );

  // Розкладку рахуємо на клієнті (Math.random) → жодних розбіжностей SSR/гідрації.
  const [tiles, setTiles] = useState<Tile[]>([]);
  useEffect(() => {
    setTiles(buildLayout(cols, ROWS));
  }, [cols]);

  // Фото у слотах (по одному на плитку).
  const [slotPhotos, setSlotPhotos] = useState<GalleryPhoto[]>([]);
  useEffect(() => {
    setSlotPhotos(photos.slice(0, tiles.length));
  }, [photos, tiles]);

  const overflow = photos.length > tiles.length;

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
            gridAutoRows: `${colW}px`,
          }}
        >
          {tiles.map((t, i) => {
            const p = slotPhotos[i];
            if (!p) return null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => openTile(p)}
                style={{ gridColumn: `${t.c + 1} / span ${t.w}`, gridRow: `${t.r + 1} / span ${t.h}` }}
                className="group overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
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
            );
          })}
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
            aria-label={prevLabel}
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className={`${ui.overlayIconBtn} absolute left-2 top-1/2 h-11 w-11 -translate-y-1/2 text-2xl sm:left-4`}
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
            aria-label={nextLabel}
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className={`${ui.overlayIconBtn} absolute right-2 top-1/2 h-11 w-11 -translate-y-1/2 text-2xl sm:right-4`}
          >
            ›
          </button>

          <button
            type="button"
            onClick={close}
            className={`${ui.overlayBtn} absolute right-3 top-3`}
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
