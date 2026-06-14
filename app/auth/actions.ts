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
    `https://${h.get("host") ?? "rxteam.vercel.app"}`
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
  if (error) return { error: error.message };

  redirect("/auth/check-email");
}

// Вхід email+пароль.
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

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
