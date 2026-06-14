import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getNextGame, getUpcomingGames, getPastGames } from "@/lib/site-data";
import GameCard from "@/components/site/GameCard";

export const dynamic = "force-dynamic"; // завжди свіжі ігри/лічильники

// /games — найближча гра + майбутні + минулі. Публічно.
export default async function GamesPage() {
  const lang = getServerLang();
  const [next, upcoming, past] = await Promise.all([
    getNextGame(),
    getUpcomingGames(),
    getPastGames(),
  ]);

  // Майбутні без найближчої (вона показана окремо зверху).
  const restUpcoming = next ? upcoming.filter((g) => g.id !== next.id) : upcoming;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "games_title")}</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">
          {st(lang, "games_next_heading")}
        </h2>
        {next ? (
          <GameCard game={next} lang={lang} />
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 p-5 text-sm text-neutral-500">
            {st(lang, "games_none_upcoming")}
          </p>
        )}
      </section>

      {restUpcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-brand-dark">
            {st(lang, "games_upcoming_heading")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {restUpcoming.map((g) => (
              <GameCard key={g.id} game={g} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">
          {st(lang, "games_past_heading")}
        </h2>
        {past.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((g) => (
              <GameCard key={g.id} game={g} lang={lang} muted />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 p-5 text-sm text-neutral-500">
            {st(lang, "games_none_past")}
          </p>
        )}
      </section>
    </div>
  );
}
