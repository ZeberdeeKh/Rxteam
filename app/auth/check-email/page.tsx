import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { ui } from "@/components/ui";

export default function CheckEmailPage() {
  const lang = getServerLang();
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="text-4xl">📬</div>
      <h1 className={`mt-3 ${ui.pageTitle}`}>
        {st(lang, "auth_check_email_title")}
      </h1>
      <p className={`mt-3 ${ui.body}`}>{st(lang, "auth_check_email_body")}</p>
    </div>
  );
}
