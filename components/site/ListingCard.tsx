"use client";

import { useState } from "react";
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
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const photos = listing.photos ?? [];
  const contact = listing.sellerUsername ? `https://t.me/${listing.sellerUsername}` : null;
  const desc = listing.description ?? "";
  const long = desc.length > CLAMP;
  const shown = !long || expanded ? desc : desc.slice(0, CLAMP).trimEnd() + "…";

  return (
    <article className={`flex flex-col ${ui.card}`}>
      {photos[active] && (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={photos[active]} target="_blank" rel="noreferrer" className="block">
          <img src={photos[active]} alt="" loading="lazy" className="aspect-square w-full object-cover" />
        </a>
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
  );
}
