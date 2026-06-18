import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { featureEnabled } from "@/lib/settings";
import { getMarketplaceListings } from "@/lib/site-data";
import { ui, btn } from "@/components/ui";

export const dynamic = "force-dynamic";

// /marketplace — публічна «Барахолка»: оголошення гравців RX Team (фото + опис + контакт у TG).
// Дзеркало гілки продажів: сюди потрапляють лише оголошення зі статусом approved.
export default async function MarketplacePage() {
  const lang = getServerLang();
  if (!(await featureEnabled("marketplace"))) {
    return <p className="text-sm text-gray-500">{st(lang, "marketplace_disabled")}</p>;
  }
  const listings = await getMarketplaceListings();

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{st(lang, "marketplace_intro")}</p>

      {listings.length === 0 ? (
        <p className={ui.emptyState}>{st(lang, "marketplace_empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const contact = l.sellerUsername ? `https://t.me/${l.sellerUsername}` : null;
            return (
              <article key={l.id} className={`flex flex-col ${ui.card}`}>
                {l.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a href={l.photos[0]} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={l.photos[0]}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  </a>
                )}
                {l.photos.length > 1 && (
                  <div className="mt-2 flex gap-1 overflow-x-auto">
                    {l.photos.slice(1).map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0">
                        <img src={url} alt="" loading="lazy" className="h-12 w-12 object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                {l.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{l.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className={ui.price}>{l.price ?? ""}</span>
                  {contact ? (
                    <a href={contact} target="_blank" rel="noreferrer" className={btn("action")}>
                      {st(lang, "marketplace_contact")}
                    </a>
                  ) : (
                    <span className={ui.metaFaint}>{l.sellerDisplay ?? ""}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
