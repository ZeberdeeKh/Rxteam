import { redirect } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getAdmin } from "@/lib/admin";
import { adminNavLinks } from "@/lib/admin-nav";
import { ui } from "@/components/ui";

export const dynamic = "force-dynamic";

// /admin не має власного контенту — відкриваємо одразу перший доступний розділ підменю.
export default async function AdminDashboard() {
  const admin = (await getAdmin())!; // layout уже відсік не-адмінів
  const lang = getServerLang();

  const first = adminNavLinks(admin, lang).find((l) => l.show);
  if (first) redirect(first.href);

  // Запасний випадок: адмін без жодної доступної секції.
  return (
    <div className={ui.pageStack}>
      <h1 className={ui.pageTitle}>{st(lang, "adm_title")}</h1>
    </div>
  );
}
