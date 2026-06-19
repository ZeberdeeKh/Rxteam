import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";
import { getSessionPlayer } from "@/lib/site-player";
import { hasPerm } from "@/lib/admin";
import { getSetting } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 1 * 1024 * 1024; // 1 МБ на файл — збігається з лімітом bucket-а `gallery`

// Визначає реальний растровий формат за magic-bytes. НЕ довіряємо client-MIME (file.type)
// чи розширенню імені: інакше SVG (image/svg+xml) проходив би й виконував <script> при
// прямому відкритті public-URL зі сторінки. Повертає null для SVG / не-зображень → reject.
function sniffImage(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return { ext: "png", mime: "image/png" };
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return { ext: "gif", mime: "image/gif" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { ext: "webp", mime: "image/webp" };
  return null;
}

// Завантаження фото в галерею. Лише для адмінів із правом `gallery`.
// Файли йдуть multipart/form-data (server actions мають жорсткий ліміт тіла).
export async function POST(req: NextRequest) {
  const player = await getSessionPlayer();
  if (!hasPerm(player, "gallery")) {
    // 404 (а не 403) — узгоджено з notFound() гейтами адмінки: не світимо існування ендпоінта.
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const caption = String(form.get("caption") ?? "").trim() || null;
  if (!files.length) {
    return NextResponse.json({ error: "no_files" }, { status: 400 });
  }

  const bucket = (await getSetting("gallery_bucket")) || "gallery";
  let created = 0;
  let skipped = 0;

  for (const file of files) {
    if (file.size === 0 || file.size > MAX_BYTES) {
      skipped++;
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    // Перевірка реального формату за magic-bytes; SVG/полігліоти/не-зображення → skip.
    // Тип і розширення беремо з ПЕРЕВІРЕНОГО контенту, а не з file.type/file.name.
    const kind = sniffImage(buf);
    if (!kind) {
      skipped++;
      continue;
    }
    const path = `photos/${randomUUID()}.${kind.ext}`;

    const up = await supabase.storage.from(bucket).upload(path, buf, { contentType: kind.mime });
    if (up.error) {
      skipped++;
      continue;
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const { error: insErr } = await supabase.from("gallery_media").insert({
      storage_path: path,
      public_url: pub.publicUrl,
      caption,
      file_size: file.size,
      status: "visible",
      uploaded_by: player?.id ?? null,
    });
    if (insErr) {
      // прибираємо осиротілий файл, якщо рядок не вставився
      await supabase.storage.from(bucket).remove([path]);
      skipped++;
      continue;
    }
    created++;
  }

  return NextResponse.json({ ok: true, created, skipped });
}
