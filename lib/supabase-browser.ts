"use client";

import { createBrowserClient } from "@supabase/ssr";

// Браузерний клієнт сайту: публічний publishable key + сесія в cookie.
// НЕ плутати з lib/supabase.ts (secret key, тільки сервер, обходить RLS).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
