import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import {
  getUpcomingGames,
  getCabinetGames,
  type CabinetGame,
} from "@/lib/site-data";
import { getSessionContext } from "@/lib/session-player";
import GameCard from "@/components/site/GameCard";
import GameActions, { GameRegistration, GameRegistrationForm } from "@/components/site/GameActions";
import { ui } from "@/components/ui";

export const dynamic = "force-dynamic"; // завжди свіжі ігри/лічильники

type Flags = { [key: string]: string | string[] | undefined };

function successKey(f: Flags): string | null {
  if (f.reg) return "cab_reg_ok";
  if (f.unreg) return "cab_unreg_ok";
  if (f.checkin) return "cab_checkin_ok";
  return null;
}

// /games — єдиний список ігор за пріоритетом, без поділу на секції: спершу ті, що відбуваються
// зараз (відкрите вікно чек-іну), далі майбутні від найближчої до найдальшої. Завершені (минулі)
// ігри на сайті не показуємо. Опис кожної гри = повний анонс; логовані можуть записатись тут.
export default async function GamesPage({ searchParams }: { searchParams: Flags }) {
  const lang = getServerLang();
  const ctx = await getSessionContext();
  const player = ctx.state === "linked" ? ctx.player : null;

  const [upcoming, cabGames] = await Promise.all([
    getUpcomingGames(), // start_at >= now, відсортовані за зростанням (найближча першою)
    player ? getCabinetGames(player.id) : Promise.resolve([] as CabinetGame[]),
  ]);

  // Стан реєстрації гравця по кожній грі (готові прапорці з getCabinetGames).
  const regMap = new Map<number, CabinetGame>(cabGames.map((g) => [g.id, g]));
  const loggedIn = !!player;
  const hasCallsign = !!player?.callsign;

  // Картка гри: дії (запис/відписка/редагування/чек-ін) — праворуч у хедері; налаштування поїздки
  // розкриваються знизу. startedView — компактний режим (лише чек-ін) для ігор, що йдуть зараз.
  const renderCard = (g: (typeof upcoming)[number], startedView = false) => {
    const reg = regMap.get(g.id);
    return (
      <GameRegistration key={g.id}>
        <GameCard
          game={g}
          lang={lang}
          headerActions={
            <GameActions
              gameId={g.id}
              lang={lang}
              loggedIn={loggedIn}
              hasCallsign={hasCallsign}
              reg={reg}
              startedView={startedView}
            />
          }
        >
          {!startedView && (
            <GameRegistrationForm
              gameId={g.id}
              lang={lang}
              loggedIn={loggedIn}
              hasCallsign={hasCallsign}
              reg={reg}
            />
          )}
        </GameCard>
      </GameRegistration>
    );
  };

  // «Відбувається зараз»: ігри гравця, чиє вікно чек-іну відкрите/щойно відмічене, але які вже
  // стартували (тому їх немає у списку майбутніх). Дають доступ до чек-іну після старту.
  const futureIds = new Set<number>(upcoming.map((g) => g.id));
  const live = cabGames.filter(
    (g) => (g.checkinOpen || g.checkedIn) && !futureIds.has(g.id),
  );

  const okKey = successKey(searchParams);
  const errVal = typeof searchParams.err === "string" ? searchParams.err : null;
  const errKey = errVal ? `err_${errVal}` : null;

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "games_title")}</h1>

      {okKey && <p className={ui.alertOk}>{st(lang, okKey)}</p>}
      {errKey && <p className={ui.alertErr}>{st(lang, errKey)}</p>}

      {live.length === 0 && upcoming.length === 0 ? (
        <p className={ui.emptyState}>{st(lang, "games_none_upcoming")}</p>
      ) : (
        // Єдиний список за пріоритетом, картки на всю ширину, одна під одною: спершу ті, що
        // відбуваються зараз (лише чек-ін), далі майбутні за близькістю до поточної дати.
        <div className="space-y-4">
          {live.map((g) => renderCard(g, true))}
          {upcoming.map((g) => renderCard(g))}
        </div>
      )}
    </div>
  );
}
