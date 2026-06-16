"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Універсальна модалка-оверлей (ADR-0026). Бекдроп + центрований контейнер (квадратний).
// Закриття: клік по бекдропу (лише якщо натиск ПОЧАВСЯ на бекдропі) + Esc.
// Вміст (шапка/тіло/футер) передається як children — структуру задає викликач.
export default function Modal({
  open,
  onClose,
  children,
  className = "max-w-md",
  closeOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        pressOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget && pressOnBackdrop.current) onClose();
      }}
    >
      <div className={`max-h-[90vh] w-full overflow-y-auto bg-white shadow-2xl ${className}`}>
        {children}
      </div>
    </div>
  );
}
