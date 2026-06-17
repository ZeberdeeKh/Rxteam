"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Drawer, btn, ui } from "@/components/ui";

// Двокрокова заявка на патч (сайт). Перше натискання відкриває бокову панель із
// поясненням (донат, бонуси, ціна); заявку створює ЛИШЕ кнопка «Підтвердити запит»
// усередині панелі через серверний екшен. Усі тексти приходять готовими пропсами —
// i18n лишається на сервері (сторінка force-dynamic, мова з кукі).
//
// ПОРТАЛ у document.body: панель рендериться в кабінеті, всередині картки .rx-chamfer
// (clip-path) та секцій .rx-reveal (will-change/transform). Такий предок створює
// контекст накладання/обрізання, тож fixed-оверлей обрізається до картки замість
// в'юпорта. Портал виносить панель у body — поза будь-яким обрізанням.
//
// Закриття після сабміту — той самий патерн, що й CreateDrawer: redirect() екшена
// це М'ЯКА навігація, клієнтський стан (open) при ній зберігається, тож submit ловимо
// самі через обгортку display:contents.
export default function PatchRequestDrawer({
  triggerLabel,
  title,
  benefits,
  priceLine,
  confirmLabel,
  closeLabel,
  action,
}: {
  triggerLabel: string;
  title: string;
  benefits: string;
  priceLine: string | null;
  confirmLabel: string;
  closeLabel: string;
  action: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button type="button" onClick={() => setOpen(true)} className={btn("action", "sm")}>
        {triggerLabel}
      </button>
      {/* createPortal лише коли open=true → завжди на клієнті (document існує). */}
      {open &&
        createPortal(
          <Drawer open onClose={() => setOpen(false)} title={title} closeLabel={closeLabel}>
            <p className={`${ui.body} whitespace-pre-line`}>{benefits}</p>
            {priceLine && <p className={`mt-3 ${ui.price}`}>{priceLine}</p>}
            {/* display:contents — обгортка ловить submit, щоб закрити панель після redirect. */}
            <div className="contents" onSubmit={() => setOpen(false)}>
              <form action={action} className="mt-4">
                <button type="submit" className={btn("action")}>
                  {confirmLabel}
                </button>
              </form>
            </div>
          </Drawer>,
          document.body,
        )}
    </div>
  );
}
