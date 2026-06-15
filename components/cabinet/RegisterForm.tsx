"use client";

import { useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import { registerForGame } from "@/app/cabinet/actions";

// Форма запису на гру: оренда + транспорт (own/need) + (для own) звідки + вільні місця.
export default function RegisterForm({ gameId, lang }: { gameId: number; lang: Lang }) {
  const [transport, setTransport] = useState<"need" | "own">("need");
  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none";

  return (
    <form action={registerForGame} className="space-y-3">
      <input type="hidden" name="gameId" value={gameId} />

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="needs_rental" className="h-4 w-4 accent-brand" />
        {st(lang, "reg_rental_q")}
      </label>

      <fieldset className="space-y-1">
        <legend className="text-sm text-gray-500">{st(lang, "reg_transport_q")}</legend>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="transport"
            value="need"
            checked={transport === "need"}
            onChange={() => setTransport("need")}
            className="accent-brand"
          />
          {st(lang, "reg_transport_need")}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="transport"
            value="own"
            checked={transport === "own"}
            onChange={() => setTransport("own")}
            className="accent-brand"
          />
          {st(lang, "reg_transport_own")}
        </label>
      </fieldset>

      {transport === "own" && (
        <div className="space-y-2">
          <input name="from_place" placeholder={st(lang, "reg_from_ph")} className={inputCls} />
          <input
            name="free_seats"
            type="number"
            min={0}
            max={8}
            placeholder={st(lang, "reg_seats_ph")}
            className={inputCls}
          />
        </div>
      )}

      <button
        type="submit"
        className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-neutral-50 transition hover:bg-brand-dark"
      >
        {st(lang, "btn_register")}
      </button>
    </form>
  );
}
