"use client";

import { useCallback, useEffect, useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import { ui, btn } from "@/components/ui";

type Listing = {
  id: number;
  photos: string[];
  description: string | null;
  price: string | null;
  sellerUsername: string | null;
  sellerDisplay: string | null;
};

// Поріг довжини опису: усе понад — ховаємо під «Розгорнути» (стандартизуємо висоту карток).
const CLAMP = 220;

export default function ListingCard({ listing, lang }: { listing: Listing; lang: Lang }) {
  const [active, setActive] = useState(0); // фото в превʼю картки
  const [idx, setIdx] = useState<number | null>(null); // індекс фото у лайтбоксі (null = закрито)
  const [expanded, setExpanded] = useState(false);

  const photos = listing.photos ?? [];
  const contact = listing.sellerUsername ? `https://t.me/${listing.sellerUsername}` : null;
  const desc = listing.description ?? "";
  const long = desc.length > CLAMP;
  const shown = !long || expanded ? desc : desc.slice(0, CLAMP).trimEnd() + "…";

  // Лайтбокс як у галереї лендінгу: ‹ › гортають усі фото, Esc — закрити, скрол body блокуємо.
  const close = useCallback(() => setIdx(null), []);
  const go = useCallback(
    (d: number) => setIdx((cur) => (cur === null ? cur : (cur + d + photos.length) % photos.length)),
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

  return (
    <>
      <article className={`flex h-full flex-col ${ui.card}`}>
        {photos[active] && (
          <button type="button" onClick={() => setIdx(active)} className="block w-full focus:outline-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[active]}
              alt=""
              loading="lazy"
              className="aspect-square w-full cursor-zoom-in object-cover"
            />
          </button>
        )}

        {photos.length > 1 && (
          <div className="mt-2 flex gap-1 overflow-x-auto">
            {photos.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`shrink-0 border ${i === active ? "border-[var(--c-brand-text)]" : "border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" className="h-12 w-12 object-cover" />
              </button>
            ))}
          </div>
        )}

        {desc && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{shown}</p>}
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 self-start text-xs font-semibold uppercase tracking-wide text-[var(--c-brand-text)] hover:underline"
          >
            {st(lang, expanded ? "marketplace_collapse" : "marketplace_expand")}
          </button>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className={ui.price}>{listing.price ?? ""}</span>
          {contact ? (
            <a href={contact} target="_blank" rel="noreferrer" className={btn("action")}>
              {st(lang, "marketplace_contact")}
            </a>
          ) : (
            <span className={ui.metaFaint}>{listing.sellerDisplay ?? ""}</span>
          )}
        </div>
      </article>

      {idx !== null && photos[idx] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
        >
          {photos.length > 1 && (
            <button
              type="button"
              aria-label={st(lang, "gallery_prev")}
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className={`${ui.overlayIconBtn} absolute left-2 top-1/2 h-11 w-11 -translate-y-1/2 text-2xl sm:left-4`}
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[idx]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[88vw] object-contain"
          />

          {photos.length > 1 && (
            <button
              type="button"
              aria-label={st(lang, "gallery_next")}
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className={`${ui.overlayIconBtn} absolute right-2 top-1/2 h-11 w-11 -translate-y-1/2 text-2xl sm:right-4`}
            >
              ›
            </button>
          )}

          <button type="button" onClick={close} className={`${ui.overlayBtn} absolute right-3 top-3`}>
            {st(lang, "gallery_close")}
          </button>
        </div>
      )}
    </>
  );
}
