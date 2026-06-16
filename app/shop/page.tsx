import type { ReactNode } from "react";
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
import { ui, btn, badgeClass } from "@/components/ui";

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
    return <p className="text-sm text-gray-500">{st(lang, "shop_disabled")}</p>;
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

  // Єдина картка-плитка для будь-якого товару (бонус або звання): назва зверху,
  // підпис, а внизу — рядок «ціна + дія/статус». Усі товари виглядають однаково.
  function ShopTile({
    title,
    subtitle,
    cost,
    highlight = false,
    children,
  }: {
    title: string;
    subtitle?: string | null;
    cost?: string;
    highlight?: boolean;
    children: ReactNode;
  }) {
    return (
      <article
        className={`flex flex-col rounded-lg border bg-white p-5 ${
          highlight ? "border-brand" : "border-gray-200"
        }`}
      >
        <h3 className={ui.cardTitle}>{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-sm font-semibold text-[var(--c-brand-text)]">{cost ?? ""}</span>
          {children}
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      {/* Опис магазину (без дубль-заголовка — назва вже у підсвіченому пункті меню). */}
      <p className="text-sm text-gray-500">{st(lang, "shop_intro")}</p>

      {okKey && <p className={ui.alertOk}>{st(lang, okKey)}</p>}
      {errKey && <p className={ui.alertErr}>{st(lang, errKey)}</p>}

      {player ? (
        <p className="text-sm text-gray-600">
          {st(lang, "shop_balance")}: <span className="font-semibold">{balance} 💰</span>
        </p>
      ) : (
        <p className={ui.alertWarn}>
          {st(lang, "shop_need_login")}{" "}
          <Link href="/login" className="font-medium underline">
            {st(lang, "nav_login")}
          </Link>
        </p>
      )}

      {/* Група: Бонуси */}
      <section className="space-y-3">
        <h2 className={ui.sectionTitle}>{st(lang, "shop_items_title")}</h2>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
            {st(lang, "shop_empty")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const affordable = !!player && balance >= it.cost;
              return (
                <ShopTile
                  key={it.id}
                  title={itemTitle(it, lang)}
                  subtitle={itemDesc(it, lang)}
                  cost={`${it.cost} 💰`}
                >
                  {player && (
                    <form action={buyItem}>
                      <input type="hidden" name="itemId" value={it.id} />
                      <button type="submit" disabled={!affordable} className={btn("action", "sm")}>
                        {st(lang, "shop_buy")}
                      </button>
                    </form>
                  )}
                </ShopTile>
              );
            })}
          </div>
        )}
      </section>

      {/* Група: Звання (купівля наступного, правила як у боті /rank) */}
      {economyOn && (
        <section className="space-y-3">
          <h2 className={ui.sectionTitle}>{st(lang, "shop_ranks_title")}</h2>
          <p className="-mt-1 text-sm text-gray-500">{st(lang, "shop_ranks_intro")}</p>

          {player && !hasPatch && <p className={ui.alertWarn}>{st(lang, "shop_rank_need_patch")}</p>}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RANKS.map((r, i) => {
              const cost = rankCosts[i] ?? 0;
              const owned = hasPatch && i <= currentIdx;
              const isCurrent = hasPatch && i === currentIdx;
              const isNext = hasPatch && r === nextR;
              const affordable = isNext && balance >= cost;
              return (
                <ShopTile
                  key={r}
                  title={r}
                  cost={i === 0 ? st(lang, "shop_rank_free") : `${cost} 💰`}
                  highlight={isCurrent}
                >
                  {isCurrent ? (
                    <span className={badgeClass("brand")}>{st(lang, "shop_rank_current")}</span>
                  ) : owned ? (
                    <span className={badgeClass("green")}>{st(lang, "shop_rank_owned")}</span>
                  ) : isNext && player ? (
                    <form action={buyRank}>
                      <input type="hidden" name="rank" value={r} />
                      <button type="submit" disabled={!affordable} className={btn("action", "sm")}>
                        {st(lang, "shop_buy")}
                      </button>
                    </form>
                  ) : i === 0 ? null : (
                    <span className="text-xs text-gray-400">🔒</span>
                  )}
                </ShopTile>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
