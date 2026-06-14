import { randomInt } from "crypto";
import { supabase } from "./supabase";

// Логіка ідентичностей і лінк-кодів. Працює через service-key (lib/supabase.ts):
// викликається з бота і з серверних дій сайту. RLS вимкнено (поточний патерн).

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // без 0/O/1/I/L
const CODE_LEN = 6;
const CODE_TTL_MIN = 15;

function makeCode(): string {
  let s = "";
  for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

// Бот: створює одноразовий код прив'язки для свого TG-профілю.
// Заразом гарантує наявність telegram-ідентичності (модель повна).
export async function createLinkCode(
  playerId: number,
  tgUserId: number,
): Promise<{ code: string; expiresAt: Date }> {
  await supabase
    .from("identities")
    .upsert(
      { player_id: playerId, provider: "telegram", external_id: String(tgUserId), verified: true },
      { onConflict: "provider,external_id" },
    );

  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000);

  // Кілька спроб на випадок колізії коду.
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeCode();
    const { error } = await supabase.from("link_codes").insert({
      code,
      player_id: playerId,
      expires_at: expiresAt.toISOString(),
    });
    if (!error) return { code, expiresAt };
  }
  throw new Error("link code generation failed");
}

export type RedeemResult =
  | { ok: true; playerId: number }
  | { ok: false; reason: "not_found" | "expired" | "used" | "taken" };

// Сайт: email-юзер уводить код → прив'язуємо його auth-акаунт до TG-профілю.
export async function redeemLinkCode(rawCode: string, authUserId: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "not_found" };

  const { data: row } = await supabase
    .from("link_codes")
    .select("code, player_id, expires_at, used_at")
    .eq("code", code)
    .maybeSingle();

  if (!row) return { ok: false, reason: "not_found" };
  if (row.used_at) return { ok: false, reason: "used" };
  if (new Date(row.expires_at as string).getTime() < Date.now()) return { ok: false, reason: "expired" };

  // Якщо цей auth-user уже прив'язаний до іншого player — не дублюємо.
  const existing = await getPlayerIdByAuthUser(authUserId);
  if (existing && existing !== row.player_id) return { ok: false, reason: "taken" };

  const { error: idErr } = await supabase.from("identities").upsert(
    {
      player_id: row.player_id as number,
      provider: "email",
      external_id: authUserId,
      verified: true,
    },
    { onConflict: "provider,external_id" },
  );
  if (idErr) return { ok: false, reason: "taken" };

  await supabase.from("link_codes").update({ used_at: new Date().toISOString() }).eq("code", code);
  return { ok: true, playerId: row.player_id as number };
}

// Резолв player_id за auth-user (email-ідентичність).
export async function getPlayerIdByAuthUser(authUserId: string): Promise<number | null> {
  const { data } = await supabase
    .from("identities")
    .select("player_id")
    .eq("provider", "email")
    .eq("external_id", authUserId)
    .maybeSingle();
  return (data?.player_id as number | undefined) ?? null;
}
