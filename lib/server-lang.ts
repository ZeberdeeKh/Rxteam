// Серверний резолвер мови сайту. ТІЛЬКИ для серверкомпонентів / route handlers (next/headers).
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLang, type Lang } from "./site-i18n";

export function getServerLang(): Lang {
  const cookieVal = cookies().get(LANG_COOKIE)?.value ?? null;
  const acceptLang = headers().get("accept-language");
  return resolveLang(cookieVal, acceptLang);
}
