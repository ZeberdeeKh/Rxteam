import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { ui } from "@/components/ui";

export const dynamic = "force-dynamic";

// Лендінг адмінки: навігацію по розділах дає рядок підпунктів у layout.
export default async function AdminDashboard() {
  const lang = getServerLang();

  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_title")}</h1>
    </div>
  );
}
