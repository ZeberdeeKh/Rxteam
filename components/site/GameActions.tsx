import Link from "next/link";
import { st, type Lang } from "@/lib/site-i18n";
import type { CabinetGame } from "@/lib/site-data";
import RegisterForm from "@/components/cabinet/RegisterForm";
import { unregisterFromGame } from "@/app/cabinet/actions";
import { ui, btn, badgeClass } from "@/components/ui";

// Дії над грою на публічній /games (слот children у GameCard).
// Перевикористовує RegisterForm/unregisterFromGame з кабінету (returnTo="/games").
// reg — стан конкретного гравця для цієї гри (з getCabinetGames), undefined якщо нема.
export default function GameActions({
  gameId,
  lang,
  loggedIn,
  hasCallsign,
  reg,
}: {
  gameId: number;
  lang: Lang;
  loggedIn: boolean;
  hasCallsign: boolean;
  reg?: CabinetGame;
}) {
  // Не залогований → запросити увійти.
  if (!loggedIn) {
    return (
      <p className="text-sm text-gray-500">
        <Link href="/login" className={ui.link}>
          {st(lang, "games_login_to_register")}
        </Link>
      </p>
    );
  }

  // Залогований без позивного → задати в кабінеті (правило registerForGame).
  if (!hasCallsign) {
    return (
      <p className="text-sm text-gray-500">
        <Link href="/cabinet" className={ui.link}>
          {st(lang, "games_need_callsign")}
        </Link>
      </p>
    );
  }

  // Записаний → бейдж + відписка (поки відкрито) або інфо про блокування.
  if (reg?.regStatus === "registered") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className={badgeClass("green")}>{st(lang, "regst_registered")}</span>
        {reg.canUnregister ? (
          <form action={unregisterFromGame}>
            <input type="hidden" name="gameId" value={gameId} />
            <input type="hidden" name="returnTo" value="/games" />
            <button type="submit" className={btn("delete")}>
              {st(lang, "btn_unregister")}
            </button>
          </form>
        ) : (
          <span className="text-xs text-gray-400">{st(lang, "cancel_locked_info")}</span>
        )}
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
