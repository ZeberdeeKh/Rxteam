import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { featureEnabled } from "@/lib/settings";
import { getMarketplaceListings } from "@/lib/site-data";
import { ui } from "@/components/ui";
import ListingCard from "@/components/site/ListingCard";

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
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
