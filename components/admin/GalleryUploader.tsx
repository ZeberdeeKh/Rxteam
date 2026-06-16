"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { st, type Lang } from "@/lib/site-i18n";
import { ui, btn } from "@/components/ui";

// Ліміт = ліміт bucket-а `gallery` у Supabase (1 МБ на файл). Тримати синхронно з route.ts.
const MAX_BYTES = 1 * 1024 * 1024;

// Завантаження фото в галерею: multipart → /api/admin/gallery/upload → router.refresh().
export default function GalleryUploader({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error" | "all_big">("idle");
  const [added, setAdded] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [oversize, setOversize] = useState(0); // завеликі серед щойно обраних (одразу при виборі)

  // Повідомлення про ліміт ОДРАЗУ при додаванні фото: рахуємо завеликі файли у виборі.
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setOversize(files.filter((f) => f.size > MAX_BYTES).length);
    setStatus("idle");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("files") as HTMLInputElement;
    const all = Array.from(input.files ?? []);
    const valid = all.filter((f) => f.size > 0 && f.size <= MAX_BYTES);
    const tooBig = all.length - valid.length;
    if (!valid.length) {
      setStatus("all_big");
      return;
    }

    const data = new FormData();
    for (const f of valid) data.append("files", f);
    const caption = (form.elements.namedItem("caption") as HTMLInputElement)?.value?.trim();
    if (caption) data.append("caption", caption);

    setStatus("uploading");
    try {
      const res = await fetch("/api/admin/gallery/upload", { method: "POST", body: data });
      if (!res.ok) throw new Error("upload failed");
      const json = await res.json();
      setAdded(json.created ?? valid.length);
      setSkipped(tooBig + (json.skipped ?? 0));
      setStatus("done");
      setOversize(0);
      form.reset();
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className={`${ui.card} space-y-3`}>
      <h2 className={ui.cardTitle}>{st(lang, "adm_gallery_upload_title")}</h2>
      <input
        type="file"
        name="files"
        accept="image/*"
        multiple
        required
        onChange={onPick}
        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-neutral-50 hover:file:bg-brand-dark"
      />
      <input
        type="text"
        name="caption"
        placeholder={st(lang, "adm_gallery_caption_ph")}
        className={ui.input}
      />

      {/* Одразу при виборі: попередження, якщо є файли > 1 МБ. */}
      {oversize > 0 && status !== "done" && (
        <p className={ui.alertWarn}>{st(lang, "adm_gallery_oversize", { n: oversize })}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "uploading"}
          className={btn("action", "md")}
        >
          {status === "uploading" ? st(lang, "adm_gallery_uploading") : st(lang, "adm_btn_upload")}
        </button>
        {status === "done" && (
          <span className={`text-sm ${ui.posText}`}>
            {st(lang, "adm_gallery_uploaded", { n: added })}
            {skipped > 0 && ` · ${st(lang, "adm_gallery_skipped", { n: skipped })}`}
          </span>
        )}
        {status === "all_big" && (
          <span className={`text-sm ${ui.negText}`}>{st(lang, "adm_gallery_all_big")}</span>
        )}
        {status === "error" && (
          <span className={`text-sm ${ui.negText}`}>{st(lang, "adm_gallery_upload_err")}</span>
        )}
      </div>
      <p className={ui.meta}>{st(lang, "adm_gallery_upload_hint")}</p>
    </form>
  );
}
