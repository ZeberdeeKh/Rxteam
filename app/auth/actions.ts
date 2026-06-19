"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, isAuthConfigured } from "@/lib/supabase-server";
import { TG_SESSION_COOKIE } from "@/lib/tg-session";

export type AuthState = { error?: string };

// Базовий URL для абсолютних лінків у листах (emailRedirectTo). Жорстко прив'язано до
// NEXT_PUBLIC_SITE_URL (фолбек — канонічний домен). НЕ беремо origin/host із заголовків
// запиту: інакше підроблений Host веде лінк підтвердження (з PKCE-кодом) на чужий домен.
function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rxteam.pl").replace(/\/$/, "");
}

// Реєстрація: email+пароль із підтвердженням пошти.
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) return { error: "auth_min_pass" };

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteOrigin()}/auth/confirm` },
  });
  if (error) {
    // Не віддаємо сирий англомовний текст Supabase в UI — мапимо на ключі словника (pl/en/uk).
    const m = error.message.toLowerCase();
    if (m.includes("already registered") || m.includes("already been registered"))
      return { error: "auth_err_email_taken" };
    if (m.includes("rate limit")) return { error: "auth_err_rate_limit" };
    if (m.includes("invalid format") || m.includes("invalid email"))
      return { error: "auth_err_email_invalid" };
    if (m.includes("password")) return { error: "auth_min_pass" };
    return { error: "auth_err_generic" };
  }

  redirect("/auth/check-email");
}

// Вхід email+пароль.
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Сирий текст Supabase → ключі словника (pl/en/uk), інакше англійський бекенд-текст витікає в UI.
    const m = error.message.toLowerCase();
    if (m.includes("not confirmed")) return { error: "auth_err_not_confirmed" };
    if (m.includes("invalid login") || m.includes("invalid credentials"))
      return { error: "auth_err_bad_creds" };
    // Supabase сам тротлить підбір пароля — показуємо це користувачу (а не «generic»).
    if (m.includes("rate limit")) return { error: "auth_err_rate_limit" };
    return { error: "auth_err_generic" };
  }

  redirect("/cabinet");
}

export async function signOut() {
  if (isAuthConfigured()) {
    try {
      await createClient().auth.signOut();
    } catch {
      /* ignore */
    }
  }
  cookies().delete(TG_SESSION_COOKIE); // власна TG-сесія
  redirect("/");
}
