import type { ReactNode } from "react";

// Згортуваний блок на нативному <details> — без JS, працює і в серверкомпонентах.
// Контент закритого блоку лишається в DOM (display:none), тому поля форм усередині
// нормально надсилаються при сабміті (важливо для сторінки налаштувань — одна спільна форма).
//
//   summary  — завжди видимий рядок-заголовок (клік розгортає/згортає);
//   children — вміст, що розкривається;
//   right    — додатковий слот праворуч від заголовка (бейдж, лічильник), перед стрілкою.
export default function Collapsible({
  summary,
  children,
  right,
  defaultOpen = false,
  className = "",
}: {
  summary: ReactNode;
  children: ReactNode;
  right?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details open={defaultOpen} className={`rx-collapse rounded-lg border border-gray-200 bg-white ${className}`}>
      <summary className="flex cursor-pointer select-none items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
        <div className="min-w-0 flex-1">{summary}</div>
        {right}
        <svg
          className="rx-chevron h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-gray-200 p-4">{children}</div>
    </details>
  );
}
