import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";

export default function CheckEmailPage() {
  const lang = getServerLang();
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="text-4xl">📬</div>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-dark">
        {st(lang, "auth_check_email_title")}
      </h1>
      <p className="mt-3 text-neutral-700">{st(lang, "auth_check_email_body")}</p>
    </div>
  );
}
