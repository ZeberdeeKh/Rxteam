import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { featureEnabled } from "@/lib/settings";
import { getSessionPlayer } from "@/lib/site-player";
import { getShopItems, type ShopItem } from "@/lib/site-data";
import { buyItem } from "@/app/shop/actions";

export const dynamic = "force-dynamic";

type Flags = { [key: string]: string | string[] | undefined };

function itemTitle(it: ShopItem, lang: Lang): string {
  return (lang === "pl" ? it.title_pl : lang === "uk" ? it.title_uk : it.title_en) ?? `#${it.id}`;
}
function itemDesc(it: ShopItem, lang: Lang): string | null {
  return (lang === "pl" ? it.desc_pl : lang === "uk" ? it.desc_uk : it.desc_en) ?? null;
}

// /shop — магазин за бали (6.3). Купівля доступна linked-гравцю з достатнім балансом.
export default async function ShopPage({ searchParams }: { searchParams: Flags }) {
  const lang = getServerLang();
  const enabled = await featureEnabled("shop");

  const okKey = searchParams.bought ? "shop_bought_ok" : null;
  const errVal = typeof searchParams.err === "string" ? searchParams.err : null;
  const errKey = errVal ? `shop_err_${errVal}` : null;

  if (!enabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "shop_title")}</h1>
        <p className="text-sm text-gray-500">{st(lang, "shop_disabled")}</p>
      </div>
    );
  }

  const [player, items] = await Promise.all([getSessionPlayer(), getShopItems(true)]);
  const balance = player?.points_balance ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "shop_title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{st(lang, "shop_intro")}</p>
      </div>

      {okKey && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{st(lang, okKey)}</p>
      )}
      {errKey && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{st(lang, errKey)}</p>
      )}

      {player ? (
        <p className="text-sm text-gray-600">
          {st(lang, "shop_balance")}: <span className="font-semibold">{balance} 💰</span>
        </p>
      ) : (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {st(lang, "shop_need_login")}{" "}
          <Link href="/login" className="font-medium underline">
            {st(lang, "nav_login")}
          </Link>
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
          {st(lang, "shop_empty")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((it) => {
            const affordable = !!player && balance >= it.cost;
            const desc = itemDesc(it, lang);
            return (
              <article
                key={it.id}
                className="flex flex-col rounded-lg border border-gray-200 bg-white p-5"
              >
                <h3 className="text-base font-semibold text-gray-900">{itemTitle(it, lang)}</h3>
                {desc && <p className="mt-1 flex-1 text-sm text-gray-600">{desc}</p>}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-brand-dark">{it.cost} 💰</span>
                  {player && (
                    <form action={buyItem}>
                      <input type="hidden" name="itemId" value={it.id} />
                      <button
                        type="submit"
                        disabled={!affordable}
                        className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-neutral-50 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {st(lang, "shop_buy")}
                      </button>
                    </form>
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
