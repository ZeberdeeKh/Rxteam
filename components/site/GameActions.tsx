import Link from "next/link";
import { st, type Lang } from "@/lib/site-i18n";
import type { CabinetGame } from "@/lib/site-data";
import RegisterForm from "@/components/cabinet/RegisterForm";
import CarpoolEditToggle from "@/components/site/CarpoolEditToggle";
import CheckinButton from "@/components/cabinet/CheckinButton";
import { unregisterFromGame } from "@/app/cabinet/actions";
import { ui, btn, badgeClass } from "@/components/ui";

// Дії над грою на публічній /games (слот children у GameCard).
// Перевикористовує RegisterForm/unregisterFromGame з кабінету (returnTo="/games").
// reg — стан конкретного гравця для цієї гри (з getCabinetGames), undefined якщо нема.
// startedView — компактний режим для вже стартованих ігор (кошик «Минулі»): лише чек-ін /
// індикатор «відмічений», без запису/відписки/поїздки.
export default function GameActions({
  gameId,
  lang,
  loggedIn,
  hasCallsign,
  reg,
  startedView = false,
}: {
  gameId: number;
  lang: Lang;
  loggedIn: boolean;
  hasCallsign: boolean;
  reg?: CabinetGame;
  startedView?: boolean;
}) {
  // Стартована гра у «Минулих»: показуємо лише чек-ін, поки вікно відкрите.
  // Незалогований / без позивного → нічого (картка лишається чистою).
  if (startedView) {
    if (!loggedIn || !hasCallsign) return null;
    if (reg?.checkedIn) {
      return (
        <span className={`text-xs font-medium ${ui.posText}`}>
          {st(lang, "game_checked_in")}
        </span>
      );
    }
    if (reg?.checkinOpen) {
      return <CheckinButton gameId={gameId} lang={lang} returnTo="/games" />;
    }
    return null;
  }
  // Не залогований → запросити увійти. Повноширинна outline-кнопка на телефоні (тач-таргет).
  if (!loggedIn) {
    return (
      <Link href="/login" className={`${btn("outline")} w-full sm:w-auto`}>
        {st(lang, "games_login_to_register")}
      </Link>
    );
  }

  // Залогований без позивного → задати в кабінеті (правило registerForGame).
  if (!hasCallsign) {
    return (
      <Link href="/cabinet" className={`${btn("outline")} w-full sm:w-auto`}>
        {st(lang, "games_need_callsign")}
      </Link>
    );
  }

  // Записаний → бейдж + відписка + кнопка редактора поїздки — в один ряд (форма розкривається нижче).
  if (reg?.regStatus === "registered") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className={badgeClass("green")}>{st(lang, "regst_registered")}</span>
        {reg.checkedIn ? (
          <span className={`text-xs font-medium ${ui.posText}`}>
            {st(lang, "game_checked_in")}
          </span>
        ) : reg.checkinOpen ? (
          <CheckinButton gameId={gameId} lang={lang} returnTo="/games" />
        ) : null}
        {reg.canUnregister ? (
          <form action={unregisterFromGame}>
            <input type="hidden" name="gameId" value={gameId} />
            <input type="hidden" name="returnTo" value="/games" />
            <button type="submit" className={btn("delete", "sm")}>
              {st(lang, "btn_unregister")}
            </button>
          </form>
        ) : (
          <span className="text-xs text-gray-400">{st(lang, "cancel_locked_info")}</span>
        )}
        <CarpoolEditToggle
          gameId={gameId}
          lang={lang}
          returnTo="/games"
          incomingCount={reg.incomingCount}
          initial={{
            transport: reg.myTransport,
            freeSeats: reg.myFreeSeats,
            ridePrice: reg.myRidePrice,
            rideNote: reg.myRideNote,
            fromLat: reg.myFromLat,
            fromLng: reg.myFromLng,
            pickups: reg.myPickups,
            seatsClosed: reg.mySeatsClosed,
          }}
        />
      </div>
    );
  }

  // Не записаний: реєстрація відкрита (або стан невідомий) → повна форма.
  if (!reg || reg.canRegister) {
    return <RegisterForm gameId={gameId} lang={lang} returnTo="/games" />;
  }

  // Реєстрацію закрито (повна гра / минув дедлайн).
  return <p className="text-xs text-gray-400">{st(lang, "games_reg_closed")}</p>;
}
