import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

// Серверний клієнт (secret key — повний доступ, обходить RLS).
// Використовувати ТІЛЬКИ в серверному коді (route handlers, бот), ніколи в браузері.
export const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
