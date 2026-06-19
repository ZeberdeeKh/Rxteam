import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { featureEnabled } from "@/lib/settings";
import { notifyAdminsBugReport } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — має збігатися з клієнтом
const RATE_LIMIT_PER_HOUR = 5;

interface Body {
  description?: string;
  email?: string;
  screenshotBase64?: string | null;
  meta?: Record<string, unknown>;
}

const MAX_DESCRIPTION_CHARS = 5000;

function clientIp(req: NextRequest): string {
  // Беремо IP лише з джерел, які проставляє платформа (Vercel) і клієнт не контролює.
  // НЕ використовуємо лівий x-forwarded-for: його задає клієнт і ним обходять rate-limit
  // (нове значення на кожен запит = новий лічильник).
  return (
    req.ip ??
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // Фіча вмикається/вимикається через settings (feature_bug_report), за замовчуванням — увімкнена.
  if (!(await featureEnabled("bug_report"))) {
    return NextResponse.json({ error: "disabled" }, { status: 503 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  if (!description) {
    return NextResponse.json({ error: "missing_description" }, { status: 400 });
  }
  if (description.length > MAX_DESCRIPTION_CHARS) {
    return NextResponse.json({ error: "description_too_long" }, { status: 413 });
  }
  if (body.screenshotBase64 && body.screenshotBase64.length * 0.75 > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "attachment_too_large" }, { status: 413 });
  }

  const ip = clientIp(req);

  // Простий rate-limit без Redis: рахуємо звіти з цього IP за останню годину в таблиці bug_reports.
  const sinceIso = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("bug_reports")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gt("created_at", sinceIso);
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const email = (body.email ?? "").trim() || null;
  const meta = body.meta ?? {};

  // Зберігаємо звіт (для перегляду адмінами) — навіть якщо Telegram недоступний.
  await supabase.from("bug_reports").insert({
    description,
    email,
    ip,
    url: typeof meta.url === "string" ? meta.url : null,
    lang: typeof meta.lang === "string" ? meta.lang : null,
    user_agent: typeof meta.userAgent === "string" ? meta.userAgent : null,
    meta,
    has_screenshot: !!body.screenshotBase64,
  });

  // Розбираємо скриншот у байти для Telegram sendPhoto (best-effort).
  let screenshot: { bytes: Buffer; mime: string } | null = null;
  if (body.screenshotBase64) {
    const m = body.screenshotBase64.match(/^data:(image\/[\w.+-]+);base64,/);
    const mime = m?.[1] ?? "image/png";
    const base64 = body.screenshotBase64.replace(/^data:image\/[\w.+-]+;base64,/, "");
    screenshot = { bytes: Buffer.from(base64, "base64"), mime };
  }

  try {
    await notifyAdminsBugReport({ description, email, meta, screenshot });
  } catch (err) {
    console.error("bug-report notify failed:", err);
    // Звіт уже збережено в БД — не вважаємо це фатальною помилкою для користувача.
  }

  return NextResponse.json({ ok: true });
}
