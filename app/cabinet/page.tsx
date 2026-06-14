import { redirect } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getSessionContext } from "@/lib/session-player";
import LinkTelegramForm from "@/components/cabinet/LinkTelegramForm";

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: { confirmed?: string; linked?: string };
}) {
  const ctx = await getSessionContext();
  if (ctx.state === "anon") redirect("/login");

  const lang = getServerLang();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "cabinet_title")}</h1>
        {searchParams.confirmed && (
          <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {st(lang, "auth_confirmed")}
          </p>
        )}
        {searchParams.linked && (
          <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {st(lang, "link_ok")}
          </p>
        )}
        <p className="mt-2 text-sm text-neutral-500">{ctx.email}</p>
      </div>

      {ctx.state === "unlinked" && <LinkTelegramForm lang={lang} />}

      {ctx.state === "linked" && (
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-neutral-500">{st(lang, "prof_callsign")}</dt>
            <dd className="font-medium">{ctx.player.callsign ?? "—"}</dd>

            <dt className="text-neutral-500">{st(lang, "prof_rank")}</dt>
            <dd className="font-medium">
              {ctx.player.has_patch ? (ctx.player.rank ?? "Recruit") : st(lang, "prof_no_rank")}
            </dd>

            <dt className="text-neutral-500">{st(lang, "prof_earned")}</dt>
            <dd className="font-medium">{ctx.player.points_earned ?? 0} ⭐</dd>

            <dt className="text-neutral-500">{st(lang, "prof_balance")}</dt>
            <dd className="font-medium">{ctx.player.points_balance ?? 0} 💰</dd>

            <dt className="text-neutral-500">{st(lang, "prof_games")}</dt>
            <dd className="font-medium">{ctx.player.games_played ?? 0}</dd>
          </dl>
        </section>
      )}
    </div>
  );
}
