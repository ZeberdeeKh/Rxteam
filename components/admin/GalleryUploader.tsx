"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { st, type Lang } from "@/lib/site-i18n";
import { ui, buttonClass } from "@/components/ui";

// Завантаження фото в галерею: multipart → /api/admin/gallery/upload → router.refresh().
export default function GalleryUploader({ lang }: { lang: Lang }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [count, setCount] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (!(data.getAll("files").some((f) => f instanceof File && f.size > 0))) return;
    setStatus("uploading");
    try {
      const res = await fetch("/api/admin/gallery/upload", { method: "POST", body: data });
      if (!res.ok) throw new Error("upload failed");
      const json = await res.json();
      setCount(json.created ?? 0);
      setStatus("done");
      form.reset();
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className={`${ui.card} space-y-3`}>
      <h2 className={ui.cardTitle}>{st(lang, "adm_gallery_upload_title")}</h2>
      <input
        type="file"
        name="files"
        accept="image/*"
        multiple
        required
        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-neutral-50 hover:file:bg-brand-dark"
      />
      <input
        type="text"
        name="caption"
        placeholder={st(lang, "adm_gallery_caption_ph")}
        className={ui.input}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "uploading"}
          className={buttonClass("primary", "md")}
        >
          {status === "uploading" ? st(lang, "adm_gallery_uploading") : st(lang, "adm_btn_upload")}
        </button>
        {status === "done" && (
          <span className="text-sm text-green-600">
            {st(lang, "adm_gallery_uploaded", { n: count })}
          </span>
        )}
        {status === "error" && (
          <span className="text-sm text-red-600">{st(lang, "adm_gallery_upload_err")}</span>
        )}
      </div>
      <p className={ui.meta}>{st(lang, "adm_gallery_upload_hint")}</p>
    </form>
  );
}
