import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSessionPlayer } from "@/lib/site-player";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SVG_BYTES = 50 * 1024; // 50 КБ — SVG-бейдж дрібний; тримати синхронно з UI

// Завантаження SVG-мініатюри ачівки. Лише майстер (як і вся сторінка /admin/achievements).
// Файл іде multipart/form-data окремим каналом (server actions мають жорсткий ліміт тіла —
// той самий підхід, що й галерея: app/api/admin/gallery/upload/route.ts).
// Зберігаємо як base64 data URL у achievements.thumbnail_svg → показ через інертний <img> (XSS-safe).
export async function POST(req: NextRequest) {
  const player = await getSessionPlayer();
  if (!player?.is_master) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  // code — первинний ключ ачівки, яку оновлюємо.
  const code = String(form.get("code") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(code)) {
    return NextResponse.json({ error: "bad_code" }, { status: 400 });
  }

  const file = form.get("thumbnail");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  if (!isSvg || file.size === 0 || file.size > MAX_SVG_BYTES) {
    return NextResponse.json({ error: "bad_file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Захист від перейменованого бінарника: вміст має містити корінь <svg.
  if (!buf.toString("utf8").includes("<svg")) {
    return NextResponse.json({ error: "not_svg" }, { status: 400 });
  }
  const dataUrl = `data:image/svg+xml;base64,${buf.toString("base64")}`;

  const { error } = await supabase
    .from("achievements")
    .update({ thumbnail_svg: dataUrl })
    .eq("code", code);
  if (error) {
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  revalidatePath("/admin/achievements");
  return NextResponse.json({ ok: true, preview: dataUrl });
}
