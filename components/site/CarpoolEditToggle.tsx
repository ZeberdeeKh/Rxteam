"use client";

import { useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import RegisterForm, { type RegisterInitial } from "@/components/cabinet/RegisterForm";
import { btn } from "@/components/ui";

// Кнопка «Редагувати поїздку» для зареєстрованої гри (на /games і /my-games).
// Форма (а з нею і мапа) монтується лише після розгортання — щоб не вантажити мапу для кожної гри.
export default function CarpoolEditToggle({
  gameId,
  lang,
  returnTo,
  initial,
}: {
  gameId: number;
  lang: Lang;
  returnTo?: string;
  initial: RegisterInitial;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className={btn("outline", "sm")}>
        🚗 {st(lang, "carpool_edit_toggle")}
      </button>
      {open && (
        <div className="mt-3">
          <RegisterForm gameId={gameId} lang={lang} returnTo={returnTo} initial={initial} editing />
        </div>
      )}
    </div>
  );
}
