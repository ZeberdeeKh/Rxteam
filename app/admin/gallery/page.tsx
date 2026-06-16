import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listGalleryMedia } from "@/lib/admin-data";
import { toggleGalleryMedia, deleteGalleryMedia } from "@/app/admin/actions";
import { ui, btn, badgeClass } from "@/components/ui";
import GalleryUploader from "@/components/admin/GalleryUploader";

export const dynamic = "force-dynamic";

export default async function AdminGallery({ searchParams }: { searchParams: { saved?: string } }) {
  await requirePerm("gallery");
  const lang = getServerLang();
  const photos = await listGalleryMedia();

  return (
    <div className={ui.pageStack}>
      {searchParams.saved && <p className={ui.alertOk}>{st(lang, "adm_saved")}</p>}

      <GalleryUploader lang={lang} />

      {photos.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_gallery_empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className={`${ui.card} space-y-2`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.public_url}
                alt={p.caption ?? ""}
                loading="lazy"
                className="aspect-square w-full rounded-md object-cover"
              />
              <div className="flex items-center justify-between gap-2">
                <span className={badgeClass(p.status === "hidden" ? "gray" : "green")}>
                  {st(lang, p.status === "hidden" ? "adm_gallery_st_hidden" : "adm_gallery_st_visible")}
                </span>
                <div className="flex gap-2">
                  <form action={toggleGalleryMedia}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={btn("action")}>
                      {st(lang, p.status === "hidden" ? "adm_btn_show" : "adm_btn_hide")}
                    </button>
                  </form>
                  <form action={deleteGalleryMedia}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={btn("delete")}>
                      {st(lang, "adm_btn_delete")}
                    </button>
                  </form>
                </div>
              </div>
              {p.caption && <p className={ui.meta}>{p.caption}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
