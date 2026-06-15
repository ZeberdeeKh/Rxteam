import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import {
  getNextGame,
  getUpcomingGames,
  getPastGames,
  getCabinetGames,
  type CabinetGame,
} from "@/lib/site-data";
import { getSessionContext } from "@/lib/session-player";
import GameCard from "@/components/site/GameCard";
import GameActions from "@/components/site/GameActions";
import { ui } from "@/components/ui";

export const dynamic = "force-dynamic"; // завжди свіжі ігри/лічильники

type Flags = { [key: string]: string | string[] | undefined };

function successKey(f: Flags): string | null {
  if (f.reg) return "cab_reg_ok";
  if (f.unreg) return "cab_unreg_ok";
  return null;
}

// /games — найближча гра + майбутні + минулі. Публічно.
// Опис кожної гри = повний анонс (як у Телеграмі). Логовані можуть записатись прямо тут.
export default async function GamesPage({ searchParams }: { searchParams: Flags }) {
  const lang = getServerLang();
  const ctx = await getSessionContext();
  const player = ctx.state === "linked" ? ctx.player : null;

  const [next, upcoming, past, cabGames] = await Promise.all([
    getNextGame(),
    getUpcomingGames(),
    getPastGames(),
    player ? getCabinetGames(player.id) : Promise.resolve([] as CabinetGame[]),
  ]);

  // Стан реєстрації гравця по кожній грі (готові прапорці з getCabinetGames).
  const regMap = new Map<number, CabinetGame>(cabGames.map((g) => [g.id, g]));
  const loggedIn = !!player;
  const hasCallsign = !!player?.callsign;

  const actions = (gameId: number) => (
    <GameActions
      gameId={gameId}
      lang={lang}
      loggedIn={loggedIn}
      hasCallsign={hasCallsign}
      reg={regMap.get(gameId)}
    />
  );

  // Майбутні без найближчої (вона показана окремо зверху).
  const restUpcoming = next ? upcoming.filter((g) => g.id !== next.id) : upcoming;

  const okKey = successKey(searchParams);
  const errVal = typeof searchParams.err === "string" ? searchParams.err : null;
  const errKey = errVal ? `err_${errVal}` : null;

  return (
    <div className="space-y-10">
      <h1 className={ui.pageTitle}>{st(lang, "games_title")}</h1>

      {okKey && <p className={ui.alertOk}>{st(lang, okKey)}</p>}
      {errKey && <p className={ui.alertErr}>{st(lang, errKey)}</p>}

      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>
          {st(lang, "games_next_heading")}
        </h2>
        {next ? (
          <GameCard game={next} lang={lang}>
            {actions(next.id)}
          </GameCard>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
            {st(lang, "games_none_upcoming")}
          </p>
        )}
      </section>

      {restUpcoming.length > 0 && (
        <section>
          <h2 className={`mb-3 ${ui.sectionTitle}`}>
            {st(lang, "games_upcoming_heading")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {restUpcoming.map((g) => (
              <GameCard key={g.id} game={g} lang={lang}>
                {actions(g.id)}
              </GameCard>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>
          {st(lang, "games_past_heading")}
        </h2>
        {past.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((g) => (
              <GameCard key={g.id} game={g} lang={lang} muted />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
            {st(lang, "games_none_past")}
          </p>
        )}
      </section>
    </div>
  );
}
