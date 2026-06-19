"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ui } from "./styles";

// Бокова панель (drawer) — висувається справа. Бекдроп + панель на всю висоту екрана.
// Той самий патерн закриття, що й Modal (ADR-0026): клік по бекдропу (натиск ПОЧАВСЯ
// на бекдропі) + Esc. Шапка із заголовком і кнопкою-хрестиком; тіло прокручується.
// Вміст (форма створення тощо) передається як children — структуру задає викликач.
export default function Drawer({
  open,
  onClose,
  title,
  children,
  closeLabel = "Close",
  className = "sm:max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
}) {
  const pressOnBackdrop = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onMouseDown={(e) => {
        pressOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressOnBackdrop.current) onClose();
      }}
    >
      <div className={`rx-drawer flex h-full w-full flex-col bg-white shadow-2xl ${className}`}>
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0 flex-1">{title && <h2 className={ui.cardTitle}>{title}</h2>}</div>
          <button type="button" onClick={onClose} className={ui.iconBtnLg} aria-label={closeLabel}>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
