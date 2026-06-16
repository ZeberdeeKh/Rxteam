"use client";

import { useMemo, useState } from "react";
import { st, type Lang } from "@/lib/site-i18n";
import type { AdminPlayer } from "@/lib/admin-data";
import { adjustPoints, setPlayerCallsign, togglePatch, makeAdmin } from "@/app/admin/actions";
import { ui, btn, badgeClass, Collapsible, GLYPH } from "@/components/ui";

// Список гравців (адмінка): пошук по будь-якому слову + компактний рядок,
// що розгортає панель дій по кліку. Серверні екшени викликаються з форм напряму.
export default function PlayersAdmin({
  players,
  isMaster,
  lang,
}: {
  players: AdminPlayer[];
  isMaster: boolean;
  lang: Lang;
}) {
  const [query, setQuery] = useState("");

  // Кожне слово запиту має зустрітися (AND) у склеєному рядку полів гравця.
  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return players;
    return players.filter((p) => {
      const hay = [
        p.callsign,
        p.name,
        p.tg_username,
        p.rank,
        p.is_master ? "master майстер" : "",
        p.is_admin ? "admin адмін" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [players, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={st(lang, "adm_players_search_ph")}
          aria-label={st(lang, "adm_players_search_ph")}
          className={`${ui.input} pl-9`}
        />
      </div>

      {filtered.length === 0 ? (
        <p className={`${ui.muted} px-1 py-2`}>{st(lang, "adm_players_search_empty")}</p>
      ) : (
        <div className={ui.listStack}>
          {filtered.map((p) => {
            const roleBadge = p.is_master ? (
              <span className={badgeClass("brand")}>{st(lang, "adm_master")}</span>
            ) : p.is_admin ? (
              <span className={badgeClass("green")}>{st(lang, "adm_role_admin")}</span>
            ) : null;

            return (
              <Collapsible
                key={p.id}
                right={roleBadge}
                summary={
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className={ui.cardTitle}>{p.callsign ?? "—"}</span>
                    {p.name && <span className="text-sm text-gray-500">{p.name}</span>}
                    {p.tg_username && <span className={ui.metaFaint}>@{p.tg_username}</span>}
                  </div>
                }
              >
                <div className="space-y-3">
                  {/* Статистика гравця */}
                  <div className={ui.meta}>
                    {st(lang, "adm_earned")}: <b>{p.points_earned}</b> · {st(lang, "adm_balance")}:{" "}
                    <b>{p.points_balance}</b> · {st(lang, "adm_games_n")}: <b>{p.games_played}</b>
                    {p.has_patch ? ` · ${GLYPH.rank} ${p.rank ?? "Recruit"}` : ""}
                  </div>

                  {/* Дії — однакові розміри полів і кнопок, рівне вирівнювання */}
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={adjustPoints} className="flex items-center gap-1">
                      <input type="hidden" name="playerId" value={p.id} />
                      <input
                        name="delta"
                        type="number"
                        placeholder={st(lang, "adm_delta_ph")}
                        className={`${ui.inputSm} w-28`}
                        required
                      />
                      <button type="submit" className={btn("action")}>
                        {st(lang, "adm_btn_adjust")}
                      </button>
                    </form>

                    <form action={setPlayerCallsign} className="flex items-center gap-1">
                      <input type="hidden" name="playerId" value={p.id} />
                      <input name="callsign" defaultValue={p.callsign ?? ""} className={`${ui.inputSm} w-28`} />
                      <button type="submit" className={btn("action")}>
                        {st(lang, "adm_btn_callsign")}
                      </button>
                    </form>

                    <form action={togglePatch}>
                      <input type="hidden" name="playerId" value={p.id} />
                      <button type="submit" className={btn("action")}>
                        {st(lang, "adm_btn_patch")}
                      </button>
                    </form>

                    {/* Призначення адміном — лише майстер, лише для звичайних гравців. */}
                    {isMaster && !p.is_master && !p.is_admin && (
                      <form action={makeAdmin}>
                        <input type="hidden" name="playerId" value={p.id} />
                        <button type="submit" className={btn("action")}>
                          {st(lang, "adm_make_admin")}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
