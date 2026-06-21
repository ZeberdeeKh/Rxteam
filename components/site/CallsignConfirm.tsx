"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Modal, btn, ui } from "@/components/ui";

// Встановлення позивного з підтвердженням (сайт). Позивний ставиться ОДИН раз, тож перед
// записом показуємо модалку-підтвердження з поясненням, що змінити його згодом можна лише
// в магазині за бали або з рангом Squad Leader. Запис робить ЛИШЕ кнопка «Підтвердити»
// усередині модалки (форма сабмітить серверний екшен saveCallsign).
//
// ПОРТАЛ у document.body: модалка рендериться в кабінеті всередині картки .rx-chamfer
// (clip-path), що обрізала б fixed-оверлей до картки. Портал виносить її поза обрізанням
// (той самий патерн, що й PatchRequestDrawer). Усі тексти приходять готовими пропсами.
export default function CallsignConfirm({
  warning,
  placeholder,
  saveLabel,
  confirmTitle,
  confirmLabel,
  cancelLabel,
  action,
}: {
  warning: string;
  placeholder: string;
  saveLabel: string;
  confirmTitle: string;
  confirmLabel: string;
  cancelLabel: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const trimmed = value.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 32;

  return (
    <div className="mt-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          minLength={2}
          maxLength={32}
          placeholder={placeholder}
          className={`${ui.input} flex-1`}
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => setOpen(true)}
          className={`${btn("action")} w-full sm:w-auto`}
        >
          {saveLabel}
        </button>
      </div>
      <p className={`mt-2 ${ui.meta}`}>{warning}</p>

      {open &&
        createPortal(
          <Modal open onClose={() => setOpen(false)}>
            <div className="space-y-4 p-5">
              <h3 className={ui.cardTitle}>{confirmTitle}</h3>
              <p className={ui.bodyStrong}>{trimmed}</p>
              <p className={`${ui.body} whitespace-pre-line`}>{warning}</p>
              {/* display:contents — обгортка ловить submit, щоб закрити модалку після redirect. */}
              <div className="contents" onSubmit={() => setOpen(false)}>
                <div className="flex flex-wrap gap-2">
                  <form action={action}>
                    <input type="hidden" name="callsign" value={trimmed} />
                    <button type="submit" className={btn("action")}>
                      {confirmLabel}
                    </button>
                  </form>
                  <button type="button" onClick={() => setOpen(false)} className={btn("ghost")}>
                    {cancelLabel}
                  </button>
                </div>
              </div>
            </div>
          </Modal>,
          document.body,
        )}
    </div>
  );
}
