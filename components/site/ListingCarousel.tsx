"use client";

import { useEffect, useRef, useState } from "react";
import { type Lang } from "@/lib/site-i18n";
import ListingCard from "./ListingCard";

type Listing = {
  id: number;
  photos: string[];
  description: string | null;
  price: string | null;
  sellerUsername: string | null;
  sellerDisplay: string | null;
};

// Горизонтальна карусель повноцінних карток (для тізера на лендінгу). Свайп на мобілці,
// стрілки ‹ › на десктопі (scroll-snap). Картка — той самий ListingCard, що й у барахолці.
// Стрілки показуємо ЛИШЕ коли стрічка переповнена (мало оголошень → стрілок немає).
export default function ListingCarousel({ listings, lang }: { listings: Listing[]; lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [listings.length]);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center border border-gray-300 bg-white text-lg text-gray-700 shadow-sm transition hover:bg-gray-50 sm:flex";

  return (
    <div className="relative">
      <div ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {listings.map((l) => (
          <div key={l.id} className="w-[80%] shrink-0 snap-start sm:w-[300px]">
            <ListingCard listing={l} lang={lang} />
          </div>
        ))}
      </div>

      {overflow && (
        <>
          <button type="button" aria-label="‹" onClick={() => scroll(-1)} className={`${arrow} -left-3`}>
            ‹
          </button>
          <button type="button" aria-label="›" onClick={() => scroll(1)} className={`${arrow} -right-3`}>
            ›
          </button>
        </>
      )}
    </div>
  );
}
