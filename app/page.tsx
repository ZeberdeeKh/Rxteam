import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getNextGame } from "@/lib/site-data";
import { formatGameWhen } from "@/lib/games";

// Лендінг (публічний): герой + складка (PL) + блок «найближча гра» + посилання.
export default async function Home() {
  const lang = getServerLang();
  const next = await getNextGame();

  const countText = (() => {
    if (!next) return "";
    return next.capacity
      ? st(lang, "games_count_cap", { n: next.count, cap: next.capacity })
      : st(lang, "games_count", { n: next.count });
  })();

  return (
    <div className="space-y-10">
      {/* Герой */}
      <section className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark">{st(lang, "home_title")}</h1>
        <p className="mt-3 text-gray-700">{st(lang, "home_hero_sub")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/games"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-neutral-50 transition hover:bg-brand-dark"
          >
            {st(lang, "home_cta_games")}
          </Link>
          <Link
            href="/ranking"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-brand hover:text-brand"
          >
            {st(lang, "home_cta_ranking")}
          </Link>
        </div>
      </section>

      {/* Найближча гра */}
      <section>
        <h2 className="text-lg font-semibold text-brand-dark">{st(lang, "home_next_title")}</h2>
        {next ? (
          <Link
            href="/games"
            className="mt-3 block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-brand"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-semibold text-gray-900">{next.title ?? "ASG"}</span>
              <span className="text-sm text-gray-500">{countText}</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              📅 {formatGameWhen(next.gather_at ?? next.start_at, lang)}
            </div>
            <div className="text-sm text-gray-600">
              📍 {next.location?.name ?? st(lang, "games_tbd_loc")}
            </div>
          </Link>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
            {st(lang, "home_next_none")}
          </p>
        )}
      </section>

      {/* Складка */}
      <section className="max-w-2xl">
        <h2 className="text-lg font-semibold text-brand-dark">{st(lang, "home_skladka_title")}</h2>
        <blockquote className="mt-3 border-l-4 border-brand/40 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
          {st(lang, "home_skladka_body")}
        </blockquote>
      </section>
    </div>
  );
}
