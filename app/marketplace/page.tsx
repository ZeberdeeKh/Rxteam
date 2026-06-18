import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { featureEnabled } from "@/lib/settings";
import { getMarketplacePage } from "@/lib/site-data";
import { ui } from "@/components/ui";
import ListingCard from "@/components/site/ListingCard";

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

// Список номерів сторінок із «…» (вікно навколо поточної + перша/остання).
function pageList(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const nums = [...new Set([1, totalPages, page, page - 1, page + 1])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

function pageBtn(active: boolean): string {
  return `inline-flex h-9 min-w-9 items-center justify-center border px-2 text-sm font-semibold ${
    active
      ? "border-[var(--c-brand-text)] text-[var(--c-brand-text)]"
      : "border-gray-300 text-gray-700 hover:bg-gray-50"
  }`;
}

// /marketplace — публічна «Барахолка»: оголошення гравців RX Team (фото + опис + контакт у TG).
// 25 оголошень на сторінку + перемикання сторінок (?page=N). Видно лише approved.
export default async function MarketplacePage({ searchParams }: { searchParams: { page?: string } }) {
  const lang = getServerLang();
  if (!(await featureEnabled("marketplace"))) {
    return <p className="text-sm text-gray-500">{st(lang, "marketplace_disabled")}</p>;
  }
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { listings, total } = await getMarketplacePage(page, PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{st(lang, "marketplace_intro")}</p>

      {total === 0 ? (
        <p className={ui.emptyState}>{st(lang, "marketplace_empty")}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} lang={lang} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-1 pt-2">
              {page > 1 && (
                <Link
                  href={`/marketplace?page=${page - 1}`}
                  aria-label={st(lang, "marketplace_page_prev")}
                  className={pageBtn(false)}
                >
                  ‹
                </Link>
              )}
              {pageList(page, totalPages).map((n, i) =>
                n === "…" ? (
                  <span key={`e${i}`} className="px-2 text-sm text-gray-400">
                    …
                  </span>
                ) : (
                  <Link key={n} href={`/marketplace?page=${n}`} className={pageBtn(n === page)}>
                    {n}
                  </Link>
                ),
              )}
              {page < totalPages && (
                <Link
                  href={`/marketplace?page=${page + 1}`}
                  aria-label={st(lang, "marketplace_page_next")}
                  className={pageBtn(false)}
                >
                  ›
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
