import type { ReactNode } from "react";

// Роздільник «АБО»: дві лінії + текст по центру (ADR-0023). Замість хардкоду по сторінках.
export default function OrDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase text-gray-400">
      <span className="h-px flex-1 bg-gray-200" />
      {children}
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
