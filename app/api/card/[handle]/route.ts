// PNG публічної картки гравця. Ціль кнопки «Завантажити картку» (кабінет), а також
// джерело картинки для бота. За прапорцем feature_player_card (default OFF).
import { getPlayerCardByCallsign } from "@/lib/player-card";
import { renderCardPng } from "@/lib/player-card-image";
import { getSetting } from "@/lib/settings";
import { type Lang } from "@/lib/site-i18n";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { handle: string } }) {
  if ((await getSetting("feature_player_card")) !== "true") {
    return new Response("Not found", { status: 404 });
  }
  const handle = decodeURIComponent(params.handle);
  const data = await getPlayerCardByCallsign(handle);
  if (!data) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const lp = url.searchParams.get("lang");
  const lang: Lang = lp === "pl" || lp === "en" || lp === "uk" ? lp : "uk";
  const download = url.searchParams.get("download") === "1";

  const base = ((await getSetting("site_url")) ?? "https://www.rxteam.pl").replace(/\/$/, "");
  const profileUrl = `${base}/u/${encodeURIComponent(data.callsign)}`;

  const png = await renderCardPng(data, lang, profileUrl);
  const headers: Record<string, string> = {
    "content-type": "image/png",
    "cache-control": "public, max-age=300",
  };
  // Кирилиця в імені файлу ламає content-disposition → фіксоване ASCII-ім'я.
  if (download) headers["content-disposition"] = 'attachment; filename="rxteam-card.png"';
  return new Response(new Uint8Array(png), { headers });
}
