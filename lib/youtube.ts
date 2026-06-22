// Перетворення посилання на YouTube у URL для вбудованого програвача (iframe).
// Клієнт-безпечно, без залежностей. Підтримує форми: watch?v=, youtu.be/, shorts/, embed/, live/.
// Повертає null, якщо це не схоже на YouTube-відео (тоді програвач просто не рендериться).

// Витягує 11-символьний id відео з найпоширеніших форматів посилань.
function parseVideoId(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const isId = (v: string | null): v is string => !!v && /^[\w-]{11}$/.test(v);

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return isId(id) ? id : null;
  }
  // youtube.com / youtube-nocookie.com
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (isId(v)) return v;
    // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return m ? m[1] : null;
  }
  return null;
}

export function youtubeEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const id = parseVideoId(raw);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
