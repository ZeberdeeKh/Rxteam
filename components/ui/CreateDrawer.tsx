"use client";

import { useState, type ReactNode } from "react";
import { btn } from "./buttons";
import Drawer from "./Drawer";

// Кнопка «створити», що відкриває бокову панель (Drawer) з формою створення нової одиниці.
// Сама форма (із серверним екшеном) приходить як children — відрендерена на сервері,
// тому серверні екшени, i18n і дефолти працюють без «use client» на сторінці-батьку.
//
// Закриття після сабміту. У App Router redirect() екшена — це М'ЯКА навігація: клієнтський
// стан (open) при ній ЗБЕРІГАється, тож саме redirect панель не закриває. Тому ловимо подію
// submit форми (вона спливає) і закриваємо панель самі. Подія долітає лише коли пройшла
// браузерна валідація (required), тож при незаповнених полях панель лишається відкритою.
// На момент спливання submit серверний екшен уже відправлено React'ом — закриття його не рве.
export default function CreateDrawer({
  label,
  title,
  children,
  closeLabel,
  className,
}: {
  label: string;
  title: string;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btn("action")}>
        <span aria-hidden className="text-base leading-none">
          +
        </span>
        {label}
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        closeLabel={closeLabel}
        className={className}
      >
        {/* display:contents — обгортка не впливає на розкладку форми, лише ловить submit. */}
        <div className="contents" onSubmit={() => setOpen(false)}>
          {children}
        </div>
      </Drawer>
    </>
  );
}
