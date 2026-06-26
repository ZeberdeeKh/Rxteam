import { redirect } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st, type Lang } from "@/lib/site-i18n";
import { getSessionContext } from "@/lib/session-player";
import { getReliability } from "@/lib/economy";
import {
  getPointLog,
  getPlayerAchievements,
  type PlayerAch,
} from "@/lib/site-data";
import { formatGameWhen } from "@/lib/games";
import LinkTelegramForm from "@/components/cabinet/LinkTelegramForm";
import PatchRequestDrawer from "@/components/site/PatchRequestDrawer";
import CallsignConfirm from "@/components/site/CallsignConfirm";
import { createStandalone, saveCallsign, requestPatch } from "@/app/cabinet/actions";
import { featureEnabled, getSetting } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import { ui, btn, badgeClass, OrDivider, GLYPH } from "@/components/ui";

export const dynamic = "force-dynamic";

type Flags = { [key: string]: string | string[] | undefined };

function successKey(f: Flags): string | null {
  if (f.confirmed) return "auth_confirmed";
  if (f.linked) return "link_ok";
  if (f.welcome) return "cab_welcome";
  if (f.callsign) return "cab_callsign_saved";
  if (f.reg) return "cab_reg_ok";
  if (f.unreg) return "cab_unreg_ok";
  if (f.checkin) return "cab_checkin_ok";
  if (f.patch_requested) return "cab_patch_requested";
  return null;
}

function achTitle(a: PlayerAch, lang: Lang): string {
  return (lang === "pl" ? a.title_pl : lang === "uk" ? a.title_uk : a.title_en) ?? a.code;
}

function achDesc(a: PlayerAch, lang: Lang): string | null {
  return (lang === "pl" ? a.description_pl : lang === "uk" ? a.description_uk : a.description_en) ?? null;
}

export default async function CabinetPage({ searchParams }: { searchParams: Flags }) {
  const ctx = await getSessionContext();
  if (ctx.state === "anon") redirect("/login");

  const lang = getServerLang();
  const okKey = successKey(searchParams);
  const errVal = typeof searchParams.err === "string" ? searchParams.err : null;
  const errKey = errVal ? `err_${errVal}` : null;

  const banners = (
    <>
      {okKey && <p className={ui.alertOk}>{st(lang, okKey)}</p>}
      {errKey && <p className={ui.alertErr}>{st(lang, errKey)}</p>}
    </>
  );

  // ── unlinked: прив'язка TG або standalone-профіль ──
  if (ctx.state === "unlinked") {
    return (
      <div className={`${ui.widthWide} ${ui.pageStack}`}>
        {ctx.email && <p className="text-sm text-gray-500">{ctx.email}</p>}
        {banners}
        <LinkTelegramForm lang={lang} />
        <OrDivider>{st(lang, "or_divider")}</OrDivider>
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>{st(lang, "standalone_title")}</h2>
          <p className="mt-1 text-sm text-gray-600">{st(lang, "standalone_intro")}</p>
          <form action={createStandalone} className="mt-3">
            <button type="submit" className={`${btn("action")} w-full sm:w-auto`}>
              {st(lang, "standalone_btn")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  // ── linked ──
  const player = ctx.player;

  // Немає позивного (standalone щойно створений / бот-профіль без позивного) → форма позивного.
  if (!player.callsign) {
    return (
      <div className={`${ui.widthWide} ${ui.pageStack}`}>
        {banners}
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>{st(lang, "callsign_title")}</h2>
          <p className="mt-1 text-sm text-gray-600">{st(lang, "callsign_intro")}</p>
          <CallsignConfirm
            warning={st(lang, "callsign_warning")}
            placeholder={st(lang, "callsign_ph")}
            saveLabel={st(lang, "callsign_btn")}
            confirmTitle={st(lang, "callsign_confirm_title")}
            confirmLabel={st(lang, "callsign_confirm_btn")}
            cancelLabel={st(lang, "callsign_cancel_btn")}
            action={saveCallsign}
          />
        </section>
      </div>
    );
  }

  const [rel, log, achs] = await Promise.all([
    getReliability(player.id),
    getPointLog(player.id, lang),
    getPlayerAchievements(player.id),
  ]);

  // Патч: показуємо наявність/відсутність; якщо немає — кнопка запиту (з дедупом «на розгляді»).
  const patchEnabled = await featureEnabled("patch");
  let patchStatus: string | null = null; // "requested" | "approved" | null
  let patchPrice: string | null = null;
  let patchBenefits = "";
  if (patchEnabled && !player.has_patch) {
    const { data: open } = await supabase
      .from("patch_requests")
      .select("status")
      .eq("player_id", player.id)
      .in("status", ["requested", "approved"])
      .limit(1)
      .maybeSingle();
    patchStatus = open?.status ?? null;
    patchPrice = await getSetting("patch_price_zl");
    // Текст-пояснення редагується в адмінці (/admin/patches → patch_msg_*); порожнє → дефолт із i18n.
    patchBenefits = (await getSetting(`patch_msg_${lang}`)) || st(lang, "patch_benefits_site");
  }

  return (
    <div className={`${ui.widthWide} ${ui.pageStack}`}>
      {ctx.email && <p className="text-sm text-gray-500">{ctx.email}</p>}
      {banners}

      {/* Профіль */}
      <section className={ui.card}>
        <h2 className={`mb-3 ${ui.legend}`}>
          {st(lang, "prof_section")}
        </h2>
        <dl className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className={ui.meta}>{st(lang, "prof_callsign")}</dt>
            <dd className={ui.bodyStrong}>{player.callsign}</dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_rank")}</dt>
            <dd className={ui.bodyStrong}>
              {player.has_patch ? player.rank ?? "Recruit" : st(lang, "prof_no_rank")}
            </dd>
          </div>
          {patchEnabled && (
            <div className="col-span-2 sm:col-span-1">
              <dt className={ui.meta}>{st(lang, "prof_patch")}</dt>
              <dd className={ui.bodyStrong}>
                {player.has_patch ? (
                  <>
                    {st(lang, "patch_received")}
                    {player.patch_at && (
                      <span className={`ml-1 ${ui.metaFaint}`}>
                        {formatGameWhen(player.patch_at, lang)}
                      </span>
                    )}
                  </>
                ) : (
                  st(lang, "patch_no_site")
                )}
              </dd>
              {!player.has_patch &&
                (patchStatus === "approved" ? (
                  <p className={`mt-1 ${ui.meta}`}>{st(lang, "patch_approved_site")}</p>
                ) : patchStatus === "requested" ? (
                  <p className={`mt-1 ${ui.meta}`}>{st(lang, "patch_under_review")}</p>
                ) : (
                  <PatchRequestDrawer
                    triggerLabel={st(lang, "patch_request_btn")}
                    title={st(lang, "patch_drawer_title")}
                    benefits={patchBenefits}
                    priceLine={patchPrice ? st(lang, "patch_price_line_site", { price: patchPrice }) : null}
                    confirmLabel={st(lang, "patch_confirm_btn")}
                    closeLabel={st(lang, "adm_close")}
                    action={requestPatch}
                  />
                ))}
            </div>
          )}
          <div>
            <dt className={ui.meta}>{st(lang, "prof_reliability")}</dt>
            <dd className={ui.bodyStrong}>{rel.pct === null ? "—" : `${rel.pct}%`}</dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_earned")}</dt>
            <dd className={ui.bodyStrong}>{player.points_earned ?? 0} {GLYPH.points}</dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_balance")}</dt>
            <dd className={ui.bodyStrong}>{player.points_balance ?? 0} {GLYPH.balance}</dd>
          </div>
          <div>
            <dt className={ui.meta}>{st(lang, "prof_games")}</dt>
            <dd className={ui.bodyStrong}>{player.games_played ?? 0}</dd>
          </div>
        </dl>
      </section>

      {/* Ачівки */}
      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>{st(lang, "ach_title")}</h2>
        {achs.length === 0 ? (
          <p className={ui.emptyState}>{st(lang, "ach_empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achs.map((a) => (
              <article key={a.code} className={`flex flex-col ${ui.card}`}>
                <div className="flex items-start gap-3">
                  {a.thumbnail_svg ? (
                    // base64 data URL → інертний <img> (XSS-safe), див. Етап 20.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumbnail_svg} alt="" className="h-16 w-16 shrink-0 object-contain" />
                  ) : (
                    <span aria-hidden className="text-4xl leading-none">
                      {GLYPH.rank}
                    </span>
                  )}
                  <h3 className={ui.cardTitle}>{achTitle(a, lang)}</h3>
                </div>
                {achDesc(a, lang) && (
                  <p className="mt-2 text-sm text-gray-600">{achDesc(a, lang)}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className={ui.metaFaint}>{formatGameWhen(a.created_at, lang)}</span>
                  <span className={badgeClass("green")}>{st(lang, "ach_earned")}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Історія балів */}
      <section>
        <h2 className={`mb-3 ${ui.sectionTitle}`}>{st(lang, "hist_title")}</h2>
        {log.length === 0 ? (
          <p className={ui.emptyState}>{st(lang, "hist_empty")}</p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 bg-white text-sm">
            {log.map((row, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2">
                <div>
                  <span className="text-gray-700">{st(lang, `reason_${row.reason}`)}</span>
                  <span className={`ml-2 ${ui.metaFaint}`}>
                    {formatGameWhen(row.created_at, lang)}
                  </span>
                  {row.itemTitle && (
                    <p className="mt-0.5 text-xs text-gray-500">{row.itemTitle}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 tabular-nums font-medium ${
                    row.delta >= 0 ? ui.posDelta : ui.negDelta
                  }`}
                >
                  {row.delta >= 0 ? "+" : ""}
                  {row.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
