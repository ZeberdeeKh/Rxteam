import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";

export default function Home() {
  const lang = getServerLang();
  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark">{st(lang, "home_title")}</h1>
      <p className="mt-3 text-neutral-700">{st(lang, "home_intro")}</p>
    </section>
  );
}
