"use client";

import { useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import RegisterForm, { type RegisterInitial } from "@/components/cabinet/RegisterForm";
import { btn } from "@/components/ui";

// Кнопка «Редагувати поїздку» для зареєстрованої гри (на /games).
// Форма (а з нею і мапа) монтується лише після розгортання — щоб не вантажити мапу для кожної гри.
// incomingCount — скільки pending-запитів на місце прийшло цьому водієві (бейдж-лічильник).
export default function CarpoolEditToggle({
  gameId,
  lang,
  returnTo,
  incomingCount = 0,
  initial,
}: {
  gameId: number;
  lang: Lang;
  returnTo?: string;
  incomingCount?: number;
  initial: RegisterInitial;
}) {
  const [open, setOpen] = useState(false);
  // Фрагмент: кнопка лишається в одному ряду з бейджем/відпискою; форма (w-full) переноситься
  // на новий повноширинний рядок у flex-wrap-контейнері.
  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <button type="button" onClick={() => setOpen((o) => !o)} className={btn("outline", "sm")}>
          {st(lang, "carpool_edit_toggle")}
        </button>
        {incomingCount > 0 && (
          <span
            className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--c-primary)] px-1 text-xs font-bold leading-none text-white"
            title={st(lang, "carpool_incoming_heading")}
          >
            {incomingCount}
          </span>
        )}
      </span>
      {open && (
        <div className="mt-1 w-full">
          <RegisterForm gameId={gameId} lang={lang} returnTo={returnTo} initial={initial} editing />
        </div>
      )}
    </>
  );
}
