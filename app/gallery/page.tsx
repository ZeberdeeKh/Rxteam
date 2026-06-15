import { notFound } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { featureEnabled } from "@/lib/settings";
import { getGalleryPhotos } from "@/lib/site-data";
import { ui } from "@/components/ui";
import GalleryGrid from "@/components/site/GalleryGrid";

export const dynamic = "force-dynamic"; // випадкова добірка на кожен запит

// /gallery — публічна галерея фото з ігор. Випадкова добірка видимих фото.
export default async function GalleryPage() {
  if (!(await featureEnabled("gallery"))) notFound();
  const lang = getServerLang();
  const photos = await getGalleryPhotos();

  return (
    <div className="space-y-6">
      <h1 className={ui.pageTitle}>{st(lang, "gallery_title")}</h1>
      <p className={ui.muted}>{st(lang, "gallery_intro")}</p>
      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
          {st(lang, "gallery_empty")}
        </p>
      ) : (
        <GalleryGrid photos={photos} closeLabel={st(lang, "gallery_close")} />
      )}
    </div>
  );
}
