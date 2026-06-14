import { redirect } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { st } from "@/lib/site-i18n";
import { getAuthUser } from "@/lib/supabase-server";

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: { confirmed?: string };
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const lang = getServerLang();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, "cabinet_title")}</h1>

      {searchParams.confirmed && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {st(lang, "auth_confirmed")}
        </p>
      )}

      <p className="mt-4 text-sm text-neutral-600">{user.email}</p>
    </div>
  );
}
