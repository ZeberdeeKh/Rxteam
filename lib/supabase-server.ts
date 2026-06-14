import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Серверний auth-клієнт: читає/оновлює сесію через cookies запиту.
// Використовувати в серверкомпонентах, route handlers, server actions.
// Для привілейованих записів (обхід RLS) — окремий lib/supabase.ts (secret key).
export function isAuthConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Виклик із серверкомпонента (cookies read-only) — оновлення сесії
            // підхопить middleware. Тут безпечно ігнорувати.
          }
        },
      },
    },
  );
}

// Поточний авторизований auth-user (або null). Стійко до відсутніх env / помилок.
export async function getAuthUser() {
  if (!isAuthConfigured()) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
