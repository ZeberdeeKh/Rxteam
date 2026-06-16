"use client";

import { useEffect, useState } from "react";

import { ui } from "@/components/ui";

// Перемикач світла/темна. Вибір зберігається в localStorage('rxteam-theme').
// Початковий клас .dark ставить інлайн-скрипт у layout (без «спалаху»); тут лише синхронізуємо стан.
export default function ThemeToggle({ title }: { title: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("rxteam-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={title}
      aria-label={title}
      aria-pressed={dark}
      className={ui.iconBtn}
    >
      {/* До монтування показуємо нейтральну іконку, щоб уникнути неузгодженості SSR. */}
      {mounted && dark ? (
        // Сонце
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Місяць
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
