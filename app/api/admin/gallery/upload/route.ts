import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";
import { getSessionPlayer } from "@/lib/site-player";
import { hasPerm } from "@/lib/admin";
import { getSetting } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 МБ на файл

// Завантаження фото в галерею. Лише для адмінів із правом `gallery`.
// Файли йдуть multipart/form-data (server actions мають жорсткий ліміт тіла).
export async function POST(req: NextRequest) {
  const player = await getSessionPlayer();
  if (!hasPerm(player, "gallery")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
    if (!file.type.startsWith("image/") || file.size === 0 || file.size > MAX_BYTES) {
      skipped++;
      continue;
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `photos/${randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const up = await supabase.storage.from(bucket).upload(path, buf, { contentType: file.type });
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
