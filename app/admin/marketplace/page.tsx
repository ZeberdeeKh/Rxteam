import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listMarketplaceListings } from "@/lib/admin-data";
import { approveListing, rejectListing, hideListing, unhideListing } from "@/app/admin/actions";
import { ui, btn, badgeClass, type BadgeColor } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, BadgeColor> = {
  pending: "amber",
  approved: "green",
  hidden: "gray",
  rejected: "red",
  sold: "gray",
  expired: "gray",
};

// Модерація барахолки (право marketplace) — веб-альтернатива апруву в адмін-групі.
export default async function AdminMarketplace({ searchParams }: { searchParams: { saved?: string } }) {
  await requirePerm("marketplace");
  const lang = getServerLang();
  const items = await listMarketplaceListings();

  return (
    <div className={ui.pageStack}>
      {searchParams.saved && <p className={ui.alertOk}>{st(lang, "adm_saved")}</p>}

      {items.length === 0 ? (
        <p className={ui.muted}>{st(lang, "adm_mp_empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className={`${ui.card} space-y-2`}>
              {it.photo_urls?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.photo_urls[0]}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className={badgeClass(STATUS_COLOR[it.status] ?? "gray")}>
                  {st(lang, `adm_mp_st_${it.status}`)}
                </span>
                {it.photo_urls.length > 1 && (
                  <span className={ui.metaFaint}>
                    {st(lang, "marketplace_photos_more", { n: it.photo_urls.length - 1 })}
                  </span>
                )}
              </div>
              {it.description && <p className={`${ui.meta} whitespace-pre-wrap`}>{it.description}</p>}
              <p className={ui.metaFaint}>
                {it.seller_tg_username ? `@${it.seller_tg_username}` : (it.seller_display ?? "—")}
              </p>
              <div className="flex flex-wrap gap-2">
                {it.status === "pending" && (
                  <>
                    <form action={approveListing}>
                      <input type="hidden" name="id" value={it.id} />
                      <button type="submit" className={btn("action")}>
                        {st(lang, "adm_btn_approve")}
                      </button>
                    </form>
                    <form action={rejectListing}>
                      <input type="hidden" name="id" value={it.id} />
                      <button type="submit" className={btn("delete")}>
                        {st(lang, "adm_btn_reject")}
                      </button>
                    </form>
                  </>
                )}
                {it.status === "approved" && (
                  <form action={hideListing}>
                    <input type="hidden" name="id" value={it.id} />
                    <button type="submit" className={btn("action")}>
                      {st(lang, "adm_btn_hide")}
                    </button>
                  </form>
                )}
                {it.status === "hidden" && (
                  <form action={unhideListing}>
                    <input type="hidden" name="id" value={it.id} />
                    <button type="submit" className={btn("action")}>
                      {st(lang, "adm_btn_show")}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
