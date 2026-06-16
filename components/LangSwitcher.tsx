"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANG_COOKIE, LANG_LABEL, SITE_LANGS, type Lang } from "@/lib/site-i18n";

// Перемикач мови: випадаючий список із повними назвами мов (як у калькуляторі).
// Пише cookie і освіжає серверні дані (router.refresh).
export default function LangSwitcher({ current }: { current: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lang = e.target.value as Lang;
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <select
      value={current}
      onChange={onChange}
      disabled={pending}
      aria-label={LANG_LABEL[current]}
      className="cursor-pointer border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 transition hover:border-brand focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-60"
    >
      {SITE_LANGS.map((l) => (
        <option key={l} value={l}>
          {LANG_LABEL[l]}
        </option>
      ))}
    </select>
  );
}
