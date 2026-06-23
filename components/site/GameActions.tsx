"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { st, type Lang } from "@/lib/site-i18n";
import type { CabinetGame } from "@/lib/site-data";
import RegisterForm from "@/components/cabinet/RegisterForm";
import CheckinButton from "@/components/cabinet/CheckinButton";
import { unregisterFromGame } from "@/app/cabinet/actions";
import { ui, btn, badgeClass } from "@/components/ui";

// Стан «розгорнуто/згорнуто» налаштувань запису. Кнопка в хедері картки (GameActions) і
// форма знизу (GameRegistrationForm) рознесені в DOM, тому ділять стан через контекст.
const RegOpenCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

function useRegOpen() {
  const ctx = useContext(RegOpenCtx);
  if (!ctx) throw new Error("useRegOpen must be used within <GameRegistration>");
  return ctx;
}

// Провайдер на одну картку гри: огортає GameCard, щоб хедер-кнопка й нижня форма ділили open.
export function GameRegistration({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <RegOpenCtx.Provider value={{ open, setOpen }}>{children}</RegOpenCtx.Provider>;
}

type CommonProps = {
  gameId: number;
  lang: Lang;
  loggedIn: boolean;
  hasCallsign: boolean;
  reg?: CabinetGame;
};

// Дії над грою в ХЕДЕРІ картки (праворуч від назви): запис / бейдж+відписка+редагування / чек-ін.
// Самі налаштування поїздки не тут — вони розкриваються знизу через GameRegistrationForm.
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
}: CommonProps & { startedView?: boolean }) {
  const { open, setOpen } = useRegOpen();

  // Стартована гра у «Минулих»: показуємо лише чек-ін, поки вікно відкрите.
  // Незалогований / без позивного → нічого (картка лишається чистою).
  if (startedView) {
    if (!loggedIn || !hasCallsign) return null;
    if (reg?.checkedIn) {
      return (
        <span className={`text-xs font-medium ${ui.posText}`}>{st(lang, "game_checked_in")}</span>
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

  // Записаний → бейдж + відписка + «Редагувати запис» (розгортає форму знизу) — праворуч у хедері.
  if (reg?.regStatus === "registered") {
    return (
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={badgeClass("green")}>{st(lang, "regst_registered")}</span>
        {reg.checkedIn ? (
          <span className={`text-xs font-medium ${ui.posText}`}>{st(lang, "game_checked_in")}</span>
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
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={btn("outline", "sm")}
          >
            {st(lang, "reg_edit_toggle")}
          </button>
          {(reg.incomingCount ?? 0) > 0 && (
            <span
              className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--c-primary)] px-1 text-xs font-bold leading-none text-white"
              title={st(lang, "carpool_incoming_heading")}
            >
              {reg.incomingCount}
            </span>
          )}
        </span>
      </div>
    );
  }

  // Не записаний, реєстрація відкрита → «Записатися» розгортає форму налаштувань знизу.
  if (!reg || reg.canRegister) {
    return (
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${btn("action")} w-full sm:w-auto`}
      >
        {st(lang, "btn_register")}
      </button>
    );
  }

  // Реєстрацію закрито (повна гра / минув дедлайн).
  return <p className="text-xs text-gray-400">{st(lang, "games_reg_closed")}</p>;
}

// Розкривні налаштування поїздки внизу картки. Монтуються лише коли open=true (керується кнопкою
// «Записатися» / «Редагувати запис» у хедері) — мапа не вантажиться для кожної гри наперед.
export function GameRegistrationForm({ gameId, lang, loggedIn, hasCallsign, reg }: CommonProps) {
  const { open } = useRegOpen();
  const ref = useRef<HTMLDivElement>(null);

  // При розкритті — плавно докрутити сторінку до форми, щоб було видно, що знизу з'явились
  // налаштування (кнопка-тригер у хедері, форма нижче — без скролу легко не помітити).
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  if (!open || !loggedIn || !hasCallsign) return null;

  // Редагування наявного запису → форма з початковими значеннями поїздки; інакше чиста форма.
  const form =
    reg?.regStatus === "registered" ? (
      <RegisterForm
        gameId={gameId}
        lang={lang}
        returnTo="/games"
        editing
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
    ) : !reg || reg.canRegister ? (
      <RegisterForm gameId={gameId} lang={lang} returnTo="/games" />
    ) : null;

  if (!form) return null;

  return (
    <div ref={ref} className="mt-4 scroll-mt-20 border-t border-gray-100 pt-4">
      {form}
    </div>
  );
}
