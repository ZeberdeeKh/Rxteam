import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listPlayers, listAchievementsAdmin } from "@/lib/admin-data";
import PlayersAdmin from "@/components/admin/PlayersAdmin";
import { ui } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminPlayers({
  searchParams,
}: {
  searchParams: {
    adjusted?: string;
    callsign?: string;
    patch?: string;
    admin?: string;
    granted?: string;
    err?: string;
  };
}) {
  const me = await requirePerm("players");
  const lang = getServerLang();
  const [players, achs] = await Promise.all([listPlayers(), listAchievementsAdmin()]);

  // Опції для видачі ачівки: лише ввімкнені (вимкнені grantAchievement не видає), назва локалізована.
  const achievementOptions = achs
    .filter((a) => a.enabled)
    .map((a) => ({
      code: a.code,
      title:
        (lang === "pl" ? a.title_pl : lang === "uk" ? a.title_uk : a.title_en) ??
        a.title_pl ??
        a.title_en ??
        a.title_uk ??
        a.code,
    }));

  const ok =
    searchParams.adjusted ||
    searchParams.callsign ||
    searchParams.patch ||
    searchParams.admin ||
    searchParams.granted;

  return (
    <div className={ui.pageStack}>
      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err === "exists" && (
        <p className={ui.alertErr}>{st(lang, "adm_grant_ach_exists")}</p>
      )}
      {searchParams.err === "fields" && <p className={ui.alertErr}>{st(lang, "adm_err_fields")}</p>}
      {searchParams.err === "callsign_empty" && (
        <p className={ui.alertErr}>{st(lang, "err_callsign_empty")}</p>
      )}
      {searchParams.err === "callsign_taken" && (
        <p className={ui.alertErr}>{st(lang, "err_callsign_taken")}</p>
      )}

      <PlayersAdmin
        players={players}
        achievementOptions={achievementOptions}
        isMaster={!!me.is_master}
        lang={lang}
      />
    </div>
  );
}
