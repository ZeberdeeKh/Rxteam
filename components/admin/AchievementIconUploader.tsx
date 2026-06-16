"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { st, type Lang } from "@/lib/site-i18n";
import { ui, GLYPH } from "@/components/ui";

const MAX_BYTES = 50 * 1024; // тримати синхронно з route.ts

// Завантаження SVG-мініатюри ачівки: вибір файлу → multipart →
// /api/admin/achievement/icon/upload → router.refresh(). Окремий канал (НЕ server action),
// бо код ачівки (PK) уже існує лише на правці — тому віджет показується тільки в розгорнутому рядку.
export default function AchievementIconUploader({
  lang,
  code,
  current,
}: {
  lang: Lang;
  code: string;
  current: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(current);
  const [status, setStatus] = useState<"idle" | "uploading" | "error" | "too_big" | "bad_type">(
    "idle",
  );

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const okType = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (!okType) {
      setStatus("bad_type");
      return;
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      setStatus("too_big");
      return;
    }

    const data = new FormData();
    data.append("code", code);
    data.append("thumbnail", file);
    setStatus("uploading");
    try {
      const res = await fetch("/api/admin/achievement/icon/upload", { method: "POST", body: data });
      if (!res.ok) throw new Error("upload failed");
      const json = await res.json();
      if (json.preview) setPreview(json.preview as string); // миттєвий показ до revalidate
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={`${ui.card} space-y-2`}>
      <span className={`block ${ui.meta}`}>{st(lang, "adm_ach_thumb")}</span>
      <div className="flex items-center gap-3">
        {preview ? (
          // base64 data URL → інертний <img> (скрипти/мережа в SVG не виконуються).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : (
          <span aria-hidden className="text-3xl leading-none">
            {GLYPH.rank}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          name="thumbnail"
          accept=".svg,image/svg+xml"
          onChange={onPick}
          disabled={status === "uploading"}
          className={ui.fileInput}
        />
      </div>
      {status === "uploading" && <p className={ui.meta}>{st(lang, "adm_ach_thumb_saving")}</p>}
      {status === "too_big" && (
        <p className={`text-sm ${ui.negText}`}>{st(lang, "adm_ach_thumb_too_big")}</p>
      )}
      {status === "bad_type" && (
        <p className={`text-sm ${ui.negText}`}>{st(lang, "adm_ach_thumb_bad_type")}</p>
      )}
      {status === "error" && (
        <p className={`text-sm ${ui.negText}`}>{st(lang, "adm_ach_thumb_err")}</p>
      )}
      <p className={ui.meta}>{st(lang, "adm_ach_thumb_hint")}</p>
    </div>
  );
}
