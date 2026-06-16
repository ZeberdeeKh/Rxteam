import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { requirePerm } from "@/lib/admin";
import { listPlayers } from "@/lib/admin-data";
import PlayersAdmin from "@/components/admin/PlayersAdmin";
import { ui } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminPlayers({
  searchParams,
}: {
  searchParams: { adjusted?: string; callsign?: string; patch?: string; admin?: string; err?: string };
}) {
  const me = await requirePerm("players");
  const lang = getServerLang();
  const players = await listPlayers();

  const ok = searchParams.adjusted || searchParams.callsign || searchParams.patch || searchParams.admin;

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_players_title")}</h1>
      {ok && <p className={ui.alertOk}>{st(lang, "adm_done")}</p>}
      {searchParams.err && <p className={ui.alertErr}>{st(lang, "err_callsign_taken")}</p>}

      <PlayersAdmin players={players} isMaster={!!me.is_master} lang={lang} />
    </div>
  );
}
