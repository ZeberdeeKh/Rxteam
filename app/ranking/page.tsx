import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getRanking } from "@/lib/site-data";
import { ui } from "@/components/ui";
import RankingTable from "@/components/site/RankingTable";

export const dynamic = "force-dynamic";

// /ranking — топ-10 за «зароблено всього». Публічно (рішення організатора 2026-06-15).
export default async function RankingPage() {
  const lang = getServerLang();
  const rows = await getRanking(10);

  return (
    <div className={ui.pageStack}>
      <div>
        <h1 className={ui.pageTitle}>{st(lang, "ranking_title")}</h1>
        <p className={`mt-1 ${ui.muted}`}>{st(lang, "ranking_intro")}</p>
      </div>

      <RankingTable rows={rows} lang={lang} />
      {rows.length > 0 && <p className={ui.meta}>{st(lang, "ranking_note_top")}</p>}
    </div>
  );
}
