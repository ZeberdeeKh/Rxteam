"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/site-i18n";

// Фіча «Повідомити про помилку» — перенесено з «Kalkulator», адаптовано під стек RX Team
// (Telegram через BOT_TOKEN на сервері, без Redis). Плаваюча кнопка + модалка + статус-машина.

export interface BugLabels {
  button: string;
  title: string;
  descriptionPlaceholder: string;
  emailOptional: string;
  attachScreenshot: string;
  screenshotHint: string;
  removeScreenshot: string;
  fileTooLarge: string;
  invalidImage: string;
  send: string;
  cancel: string;
  success: string;
  successHint: string;
  close: string;
  error: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "error" };

// 5 MB — має збігатися з MAX_IMAGE_BYTES у /api/bug-report.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const sz = { width: 16, height: 16 } as const;
const svg = "0 0 24 24";

const IconBug = (p: { size?: number }) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13V6a3 3 0 1 1 6 0v1.13" />
    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z" />
    <path d="M3 13h3M18 13h3M3 8l3 1M18 9l3-1M3 18l3-1M18 17l3 1M12 20v-8" />
  </svg>
);
const IconX = (p: { size?: number }) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconSpinner = () => (
  <svg className="animate-spin" {...sz} viewBox={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
  </svg>
);
const IconPaperclip = () => (
  <svg width="14" height="14" viewBox={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconCheck = (p: { size?: number }) => (
  <svg width={p.size ?? 28} height={p.size ?? 28} viewBox={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4 12 14.01l-3-3" />
  </svg>
);

export default function BugReport({ labels, lang }: { labels: BugLabels; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pressOnBackdrop = useRef(false);

  const sending = status.kind === "sending";

  const openModal = useCallback(() => {
    setStatus({ kind: "idle" });
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (sending) return;
    setOpen(false);
  }, [sending]);

  // Скидаємо файл при закритті; повністю чистимо форму після успіху.
  useEffect(() => {
    if (!open) {
      setScreenshot(null);
      setFileName(null);
      setFileError(null);
    }
  }, [open]);

  useEffect(() => {
    if (status.kind === "success") {
      setDescription("");
      setEmail("");
      setScreenshot(null);
      setFileName(null);
      setFileError(null);
    }
  }, [status.kind]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setScreenshot(null);
      setFileName(null);
      setFileError(labels.invalidImage);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setScreenshot(null);
      setFileName(null);
      setFileError(labels.fileTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(typeof reader.result === "string" ? reader.result : null);
      setFileName(file.name);
      setFileError(null);
    };
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!description.trim() || sending || status.kind === "success") return;
    setStatus({ kind: "sending" });
    const meta = {
      url: typeof window !== "undefined" ? window.location.href : "",
      lang,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
    };
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          email: email.trim(),
          screenshotBase64: screenshot,
          meta,
        }),
      });
      if (!res.ok) {
        setStatus({ kind: "error" });
        return;
      }
      setStatus({ kind: "success" });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  const canSend = description.trim().length > 0 && !sending && status.kind !== "success";

  return (
    <>
      {/* Плаваюча кнопка: темна «пігулка» вдень, світла вночі. neutral НЕ перемикається. */}
      <button
        type="button"
        onClick={openModal}
        data-bug-ignore
        title={labels.button}
        aria-label={labels.button}
        className="group fixed bottom-4 right-4 z-40 flex items-center rounded-full bg-neutral-800 text-neutral-50 shadow-lg transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center">
          <IconBug size={18} />
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold uppercase tracking-wide transition-all duration-300 group-hover:max-w-[260px]">
          <span className="pr-4">{labels.button}</span>
        </span>
      </button>

      {open && (
        <div
          data-bug-ignore
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            pressOnBackdrop.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && pressOnBackdrop.current && !sending) closeModal();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            {status.kind === "success" ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <IconCheck size={28} />
                </div>
                <h3 className="text-sm font-bold text-gray-800">{labels.success}</h3>
                <p className="max-w-xs text-xs font-normal text-gray-500">{labels.successHint}</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 bg-brand-600 px-6 py-2 text-sm font-bold uppercase tracking-wide text-neutral-50 shadow-sm transition-colors hover:bg-brand-500"
                >
                  {labels.close}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <span className="text-brand-600">
                      <IconBug size={16} />
                    </span>
                    {labels.title}
                  </h3>
                  <button
                    onClick={closeModal}
                    disabled={sending}
                    className="p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                    aria-label={labels.cancel}
                  >
                    <IconX size={18} />
                  </button>
                </div>

                <div className="space-y-3 p-5">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={labels.descriptionPlaceholder}
                    rows={4}
                    className="w-full resize-none border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={labels.emailOptional}
                    className="w-full border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />

                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleFile}
                      className="hidden"
                    />
                    {!screenshot ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 border border-dashed border-gray-300 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <span className="text-gray-500">
                          <IconPaperclip />
                        </span>
                        {labels.attachScreenshot}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={screenshot} alt="" className="w-full border border-gray-200" />
                        <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                          <span className="truncate">{fileName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshot(null);
                              setFileName(null);
                              setFileError(null);
                            }}
                            aria-label={labels.removeScreenshot}
                            className="flex flex-shrink-0 items-center gap-1 text-gray-400 transition-colors hover:text-rose-600"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    )}
                    {fileError ? (
                      <p className="text-xs font-normal text-rose-600">{fileError}</p>
                    ) : (
                      !screenshot && <p className="text-xs font-normal text-gray-400">{labels.screenshotHint}</p>
                    )}
                  </div>

                  {status.kind === "error" && (
                    <p className="text-xs font-normal text-rose-600">{labels.error}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
                  <button
                    onClick={closeModal}
                    disabled={sending}
                    className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800 disabled:opacity-40"
                  >
                    {labels.cancel}
                  </button>
                  <button
                    onClick={submit}
                    disabled={!canSend}
                    className="flex items-center gap-1.5 bg-brand-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-neutral-50 shadow-sm transition-colors hover:bg-brand-500 disabled:opacity-40"
                  >
                    {sending ? <IconSpinner /> : <IconBug size={14} />}
                    {labels.send}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
