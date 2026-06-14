import { NextResponse, type NextRequest } from "next/server";
import { ensurePlayer } from "@/lib/players";
import { verifyTelegramAuth, isAuthFresh } from "@/lib/tg-auth";
import { makeTgSession, TG_SESSION_COOKIE, TG_SESSION_MAX_AGE } from "@/lib/tg-session";

export const runtime = "nodejs";

// Callback Telegram Login Widget (redirect-режим): перевіряємо підпис,
// знаходимо/створюємо player за tg_user_id, ставимо власну сесію-cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const data: Record<string, string> = {};
  searchParams.forEach((v, k) => (data[k] = v));

  const botToken = process.env.BOT_TOKEN;
  if (!botToken || !verifyTelegramAuth(data, botToken) || !isAuthFresh(data.auth_date)) {
    return NextResponse.redirect(`${origin}/login?error=tg`);
  }

  const player = await ensurePlayer({
    id: Number(data.id),
    first_name: data.first_name,
    last_name: data.last_name,
    username: data.username,
  });

  const res = NextResponse.redirect(`${origin}/cabinet?tg=1`);
  res.cookies.set(TG_SESSION_COOKIE, makeTgSession(player.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: TG_SESSION_MAX_AGE,
  });
  return res;
}
