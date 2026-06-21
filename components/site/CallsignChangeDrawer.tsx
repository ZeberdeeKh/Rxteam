"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Drawer, btn, ui } from "@/components/ui";

// Зміна позивного в магазині (сайт). Кнопка відкриває бокову панель із полем нового
// позивного + ціною; зміну робить ЛИШЕ кнопка «Змінити» (форма сабмітить changeCallsign).
// Тексти приходять готовими пропсами (сторінка force-dynamic). Портал у document.body —
// щоб fixed-панель не обрізалась карткою .rx-chamfer (як PatchRequestDrawer).
export default function CallsignChangeDrawer({
  triggerLabel,
  title,
  intro,
  currentLine,
  placeholder,
  priceLine,
  confirmLabel,
  closeLabel,
  canAfford,
  action,
}: {
  triggerLabel: string;
  title: string;
  intro: string;
  currentLine: string;
  placeholder: string;
  priceLine: string;
  confirmLabel: string;
  closeLabel: string;
  canAfford: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 32;

  return (
    <div className="mt-1">
      <button type="button" onClick={() => setOpen(true)} className={btn("action")}>
        {triggerLabel}
      </button>
      {open &&
        createPortal(
          <Drawer open onClose={() => setOpen(false)} title={title} closeLabel={closeLabel}>
            <p className={ui.body}>{intro}</p>
            <p className={`mt-2 ${ui.meta}`}>{currentLine}</p>
            <p className={`mt-3 ${ui.price}`}>{priceLine}</p>
            {/* display:contents — обгортка ловить submit, щоб закрити панель після redirect. */}
            <div className="contents" onSubmit={() => setOpen(false)}>
              <form action={action} className="mt-4 space-y-3">
                <input
                  name="callsign"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  minLength={2}
                  maxLength={32}
                  placeholder={placeholder}
                  className={ui.input}
                />
                <button type="submit" disabled={!valid || !canAfford} className={btn("action")}>
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
