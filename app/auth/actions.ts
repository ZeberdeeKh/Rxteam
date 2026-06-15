"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, isAuthConfigured } from "@/lib/supabase-server";
import { TG_SESSION_COOKIE } from "@/lib/tg-session";

export type AuthState = { error?: string };

function siteOrigin(): string {
  const h = headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    h.get("origin") ??
    `https://${h.get("host") ?? "www.rxteam.pl"}`
  );
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
