import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getSessionContext } from "@/lib/session-player";
import { featureEnabled } from "@/lib/settings";
import { getCarpool, getNextGame, type CarpoolDriver } from "@/lib/site-data";
import CarpoolView from "@/components/site/CarpoolView";
import { requestSeat, cancelSeatRequest, decideRide } from "@/app/carpool/actions";
import { ui, btn, badgeClass } from "@/components/ui";

export const dynamic = "force-dynamic"; // завжди свіжі піни/місця/запити

type Flags = { [key: string]: string | string[] | undefined };

const PAST_CUTOFF_MS = 3 * 3600 * 1000;

// /carpool?game=<id> — карпул-мапа гри: піни водіїв навколо полігону + бронювання місць.
// Публічно (перегляд read-only); дії потребують входу.
export default async function CarpoolPage({ searchParams }: { searchParams: Flags }) {
  if (!(await featureEnabled("carpool_map"))) notFound();

  const lang = getServerLang();
  const ctx = await getSessionContext();
  const player = ctx.state === "linked" ? ctx.player : null;

  // Гра з ?game=… або найближча майбутня.
  const gameParam = typeof searchParams.game === "string" ? Number(searchParams.game) : NaN;
  let gameId: number | null = Number.isFinite(gameParam) ? gameParam : null;
  if (gameId == null) {
    const next = await getNextGame();
    gameId = next?.id ?? null;
  }

  const okVal = typeof searchParams.ok === "string" ? searchParams.ok : null;
  const errVal = typeof searchParams.err === "string" ? searchParams.err : null;

  if (gameId == null) {
    return (
      <div className={ui.pageStack}>
        <h1 className={ui.pageTitle}>{st(lang, "carpool_title")}</h1>
        <p className={ui.emptyState}>{st(lang, "carpool_no_game")}</p>
      </div>
    );
  }

  const data = await getCarpool(gameId, player?.id ?? null);
  if (!data) notFound();

  const me = data.me;
  const isPast =
    data.game.status !== "announced" ||
    new Date(data.game.startAt).getTime() < Date.now() - PAST_CUTOFF_MS;

  // Контроль бронювання для одного водія (серверні форми — сторінка серверна).
  function booking(d: CarpoolDriver) {
    if (d.isMe || isPast) return null;
    if (!player) {
      return (
        <Link href="/login" className={ui.link}>
          {st(lang, "carpool_request_login")}
        </Link>
      );
    }
    if (d.myRequest === "accepted") {
      return (
        <span className="inline-flex items-center gap-2">
          <span className={badgeClass("green")}>{st(lang, "carpool_request_accepted")}</span>
          {d.tgUsername && (
            <a
              href={`https://t.me/${d.tgUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className={ui.link}
            >
              @{d.tgUsername}
            </a>
          )}
        </span>
      );
    }
    if (d.myRequest === "pending") {
      return (
        <form action={cancelSeatRequest} className="inline-flex items-center gap-2">
          <input type="hidden" name="gameId" value={data!.game.id} />
          <input type="hidden" name="driverPlayerId" value={d.playerId} />
          <span className={badgeClass("amber")}>{st(lang, "carpool_request_pending")}</span>
          <button type="submit" className={btn("ghost", "sm")}>
            {st(lang, "carpool_cancel_request")}
          </button>
        </form>
      );
    }
    if (d.seatsClosed || d.freeSeats < 1) {
      return <span className={ui.muted}>{st(lang, "carpool_seats_closed")}</span>;
    }
    return (
      <form action={requestSeat}>
        <input type="hidden" name="gameId" value={data!.game.id} />
        <input type="hidden" name="driverPlayerId" value={d.playerId} />
        <button type="submit" className={btn("action", "sm")}>
          {st(lang, "carpool_request_seat")}
        </button>
      </form>
    );
  }

  return (
    <div className={ui.pageStack}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className={ui.pageTitle}>
          {st(lang, "carpool_map_for", { title: data.game.title ?? "ASG" })}
        </h1>
        <Link href="/games" className={ui.link}>
          {st(lang, "carpool_back_games")}
        </Link>
      </div>

      {okVal && <p className={ui.alertOk}>{st(lang, `carpool_ok_${okVal}`)}</p>}
      {errVal && <p className={ui.alertErr}>{st(lang, `carpool_err_${errVal}`)}</p>}
      {isPast && <p className={ui.alertWarn}>{st(lang, "carpool_past")}</p>}

      <p className={ui.body}>{st(lang, "carpool_intro")}</p>

      <CarpoolView
        lang={lang}
        gameId={data.game.id}
        venue={data.venue}
        drivers={data.drivers.map((d) => ({
          playerId: d.playerId,
          label: d.callsign ?? d.name ?? "?",
          fromPlace: d.fromPlace,
          freeSeats: d.freeSeats,
          seatsClosed: d.seatsClosed,
          lat: d.lat,
          lng: d.lng,
          isMe: d.isMe,
        }))}
        canSetPin={!!me?.isDriver && !isPast}
        myPin={
          me?.isDriver && me.fromLat != null && me.fromLng != null
            ? { lat: me.fromLat, lng: me.fromLng }
            : null
        }
      />

      {/* Водії + бронювання — надійний список під мапою (працює і на вузьких екранах) */}
      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>{st(lang, "carpool_drivers_heading")}</h2>
        {data.drivers.length === 0 ? (
          <p className={ui.emptyState}>{st(lang, "carpool_no_drivers")}</p>
        ) : (
          <ul className={ui.listStack}>
            {data.drivers.map((d) => (
              <li
                key={d.playerId}
                className={`${ui.card} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}
              >
                <div>
                  <p className={ui.bodyStrong}>
                    {d.callsign ?? d.name ?? "?"}
                    {d.isMe ? ` ${st(lang, "carpool_you")}` : ""}
                  </p>
                  <p className={ui.muted}>
                    {(d.fromPlace ? `${d.fromPlace} · ` : "") +
                      (d.seatsClosed
                        ? st(lang, "carpool_seats_closed")
                        : st(lang, "carpool_seats_free", { n: d.freeSeats }))}
                  </p>
                </div>
                <div className="shrink-0">{booking(d)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Вхідні запити на місце (коли глядач — водій) */}
      {me?.isDriver && data.incoming.length > 0 && (
        <section>
          <h2 className={`mb-3 ${ui.sectionTitle}`}>{st(lang, "carpool_incoming_heading")}</h2>
          <ul className={ui.listStack}>
            {data.incoming.map((r) => (
              <li
                key={r.requestId}
                className={`${ui.card} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}
              >
                <p className={ui.bodyStrong}>{r.passengerCallsign ?? r.passengerName ?? "?"}</p>
                <div className="flex shrink-0 gap-2">
                  <form action={decideRide}>
                    <input type="hidden" name="gameId" value={data.game.id} />
                    <input type="hidden" name="requestId" value={r.requestId} />
                    <input type="hidden" name="decision" value="accept" />
                    <button type="submit" className={btn("action", "sm")}>
                      {st(lang, "carpool_accept")}
                    </button>
                  </form>
                  <form action={decideRide}>
                    <input type="hidden" name="gameId" value={data.game.id} />
                    <input type="hidden" name="requestId" value={r.requestId} />
                    <input type="hidden" name="decision" value="decline" />
                    <button type="submit" className={btn("ghost", "sm")}>
                      {st(lang, "carpool_decline")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
