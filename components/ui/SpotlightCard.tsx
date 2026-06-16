"use client";

import { useRef, type ReactNode } from "react";

// Тактична картка ab3: зрізані кути (chamfer) або насічки (notch) + сяйво (spotlight)
// за курсором. Клієнтський компонент (onMouseMove оновлює CSS-змінні --mx/--my).
// children можуть бути серверним вмістом — App Router це дозволяє.
type Variant = "chamfer" | "notch" | "flat";

export default function SpotlightCard({
  children,
  className = "",
  variant = "chamfer",
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shape = variant === "chamfer" ? "rx-chamfer" : variant === "notch" ? "rx-notch" : "";

  return (
    <div
      ref={ref}
      className={`rx-spotlight ${shape} p-5 text-gray-900 ${className}`.trim()}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
