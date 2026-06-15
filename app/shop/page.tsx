import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { featureEnabled } from "@/lib/settings";
import { getSessionPlayer } from "@/lib/site-player";
import { getShopItems, type ShopItem } from "@/lib/site-data";
import {
  RANKS,
  RANK_COST_KEY,
  RANK_COST_FALLBACK,
  getPointValue,
  nextRank,
  type Rank,
} from "@/lib/economy";
import { buyItem, buyRank } from "@/app/shop/actions";
import { ui } from "@/components/ui";

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

  const okKey = searchParams.rank_bought
    ? "shop_rank_bought_ok"
    : searchParams.bought
      ? "shop_bought_ok"
      : null;
  const errVal = typeof searchParams.err === "string" ? searchParams.err : null;
  const errKey = errVal ? `shop_err_${errVal}` : null;

  if (!enabled) {
    return (
      <div className="space-y-4">
        <h1 className={ui.pageTitle}>{st(lang, "shop_title")}</h1>
        <p className="text-sm text-gray-500">{st(lang, "shop_disabled")}</p>
      </div>
    );
  }

  const [player, items, economyOn] = await Promise.all([
    getSessionPlayer(),
    getShopItems(true),
    featureEnabled("economy"),
  ]);
  const balance = player?.points_balance ?? 0;

  // Звання: ладдер з цінами + поточне/наступне (правила як у боті /rank).
  const hasPatch = !!player?.has_patch;
  const current = player?.rank ?? "Recruit";
  const currentIdx = hasPatch ? RANKS.indexOf(current as Rank) : -1;
  const nextR = hasPatch ? nextRank(current) : null;
  const rankCosts = economyOn
    ? await Promise.all(
        RANKS.map((r, i) =>
          i === 0 ? Promise.resolve(0) : getPointValue(RANK_COST_KEY[r], RANK_COST_FALLBACK[r]),
        ),
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.pageTitle}>{st(lang, "shop_title")}</h1>
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
                        className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium uppercase tracking-wide text-neutral-50 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Звання за бали — купівля наступного (правила як у боті /rank). */}
      {economyOn && (
        <section className="space-y-3">
          <div>
            <h2 className={ui.sectionTitle}>{st(lang, "shop_ranks_title")}</h2>
            <p className="mt-1 text-sm text-gray-500">{st(lang, "shop_ranks_intro")}</p>
          </div>

          {player && !hasPatch && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {st(lang, "shop_rank_need_patch")}
            </p>
          )}

          <div className="space-y-2">
            {RANKS.map((r, i) => {
              const cost = rankCosts[i] ?? 0;
              const owned = hasPatch && i <= currentIdx;
              const isCurrent = hasPatch && i === currentIdx;
              const isNext = hasPatch && r === nextR;
              const affordable = isNext && balance >= cost;
              return (
                <div
                  key={r}
                  className={`flex items-center justify-between gap-3 rounded-lg border bg-white p-4 ${
                    isCurrent ? "border-brand" : "border-gray-200"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r}</p>
                    <p className="text-xs text-gray-500">
                      {i === 0 ? st(lang, "shop_rank_free") : `${cost} 💰`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isCurrent ? (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
                        {st(lang, "shop_rank_current")}
                      </span>
                    ) : owned ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {st(lang, "shop_rank_owned")}
                      </span>
                    ) : isNext && player ? (
                      <form action={buyRank}>
                        <input type="hidden" name="rank" value={r} />
                        <button
                          type="submit"
                          disabled={!affordable}
                          className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium uppercase tracking-wide text-neutral-50 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {st(lang, "shop_buy")}
                        </button>
                      </form>
                    ) : i === 0 ? null : (
                      <span className="text-xs text-gray-400">🔒</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
