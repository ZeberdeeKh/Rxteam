import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Освіжає auth-сесію сайту на кожному запиті (крім /api/* — бот/крони).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Якщо публічні env не задані — пропускаємо без сесії, не валимо сайт у 500.
  if (!url || !key) return response;

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() тригерить ротацію токена за потреби. Помилку мережі/Supabase
  // глушимо — оновлення сесії не повинно валити сайт.
  try {
    await supabase.auth.getUser();
  } catch {
    /* ignore */
  }

  return response;
}

export const config = {
  // Усе, крім /api (бот/крони), статики Next і файлів із розширенням.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
