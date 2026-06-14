"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANG_COOKIE, LANG_FLAG, SITE_LANGS, type Lang } from "@/lib/site-i18n";

// Перемикач мови: пише cookie і освіжає серверні дані (router.refresh).
export default function LangSwitcher({ current }: { current: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLang(lang: Lang) {
    // 1 рік, доступний усьому сайту.
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-1" aria-busy={pending}>
      {SITE_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={l === current}
          title={l.toUpperCase()}
          className={`rounded px-1.5 py-0.5 text-base leading-none transition ${
            l === current ? "bg-brand/10 ring-1 ring-brand/40" : "opacity-60 hover:opacity-100"
          }`}
        >
          {LANG_FLAG[l]}
        </button>
      ))}
    </div>
  );
}
