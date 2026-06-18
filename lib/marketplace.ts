// Барахолка / Marketplace (Етап 28). Bot-agnostic ядро: приймає grammy `Api`
// (ctx.api у боті / bot.api у кроні), щоб логіка не залежала від точки виклику й
// не було циклічного імпорту з lib/bot.ts.
//
// Потік: фото з описом у гілці продажів → якщо в описі #promo І автор має патч →
// заливаємо фото в Storage, створюємо 'pending'-оголошення, шлемо картку на апрув у
// адмін-групу. Альбом (media_group_id) збирається в ОДНЕ оголошення (RPC
// mp_collect_album_photo) + фіналізація з debounce. Зняття — markDeleted/deleteListing.
import { randomUUID } from "crypto";
import { type Api } from "grammy";
import { supabase } from "./supabase";
import { getSetting } from "./settings";
import { getAdminsWithPerm } from "./players";
import { tr } from "./strings";
import { type Lang } from "./i18n";

const FINALIZE_DELAY_MS = 2000; // скільки чекати перед фіналізацією альбому
const QUIET_MS = 1500; // якщо нове фото прийшло пізніше за це — фіналізує наступний виклик
const STUCK_COLLECTING_MIN = 10; // прибирати «завислі» collecting старші за N хв

export type MarketplaceListing = {
  id: number;
  status: string;
  description: string | null;
  price: string | null;
  photo_urls: string[];
  storage_paths: string[];
  photo_file_unique_ids: string[];
  tg_chat_id: number;
  tg_message_id: number | null;
  tg_message_ids: number[];
  media_group_id: string | null;
  is_promo: boolean;
  seller_player_id: number | null;
  seller_tg_user_id: number | null;
  seller_tg_username: string | null;
  seller_display: string | null;
};

export type SellerInfo = {
  playerId: number | null;
  tgUserId: number;
  username: string | null;
  display: string | null;
  lang: Lang;
  hasPatch: boolean;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Шукає тег #promo в описі (без урахування регістру) і вирізає його з тексту.
export function extractPromo(
  caption: string | null,
  tag: string,
): { isPromo: boolean; cleaned: string | null } {
  if (!caption) return { isPromo: false, cleaned: null };
  const isPromo = caption.toLowerCase().includes(tag.toLowerCase());
  const cleaned = (
    isPromo ? caption.replace(new RegExp(escapeRegex(tag), "ig"), "") : caption
  )
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { isPromo, cleaned: cleaned || null };
}

// Контактне посилання продавця для сайту/картки: t.me/username, інакше ім'я без лінку.
export function sellerLink(username: string | null, display: string | null): string {
  return username ? `https://t.me/${username}` : (display ?? "?");
}

async function dm(api: Api, tgUserId: number | null | undefined, text: string) {
  if (!tgUserId) return;
  try {
    await api.sendMessage(tgUserId, text);
  } catch {}
}

async function bucketName(): Promise<string> {
  return (await getSetting("marketplace_bucket")) || "marketplace";
}

async function removeFiles(paths: string[] | null | undefined) {
  if (!paths?.length) return;
  try {
    await supabase.storage.from(await bucketName()).remove(paths);
  } catch {}
}

async function deleteTgMessages(api: Api, chatId: number, ids: number[] | null | undefined) {
  for (const id of ids ?? []) {
    try {
      await api.deleteMessage(chatId, id);
    } catch {}
  }
}

// Скачати фото з Telegram і залити в публічний bucket. → {url, path} | null.
async function downloadAndUpload(api: Api, fileId: string): Promise<{ url: string; path: string } | null> {
  try {
    const file = await api.getFile(fileId);
    if (!file.file_path) return null;
    const res = await fetch(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "image/jpeg";
    const ext = (mime.split("/")[1] ?? "jpg").replace("jpeg", "jpg").replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `listings/${randomUUID()}.${ext}`;
    const bucket = await bucketName();
    const up = await supabase.storage.from(bucket).upload(path, buf, { contentType: mime });
    if (up.error) return null;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: pub.publicUrl, path };
  } catch (e) {
    console.error("marketplace downloadAndUpload failed", e);
    return null;
  }
}

async function fetchSeller(playerId: number | null, tgUserId: number | null) {
  let q = supabase.from("players").select("has_patch, lang, tg_user_id");
  if (playerId) q = q.eq("id", playerId);
  else if (tgUserId) q = q.eq("tg_user_id", tgUserId);
  else return null;
  const { data } = await q.maybeSingle();
  return data;
}

// Картку з фото + кнопками Approve/Reject у адмін-групу (chores_chat_id). Фолбек — DM
// адмінам із правом marketplace. Викликається після створення 'pending'-оголошення.
export async function postApprovalCard(api: Api, listingId: number) {
  const { data: l } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();
  if (!l || !l.photo_urls?.length) return;

  const link = sellerLink(l.seller_tg_username, l.seller_display);
  const extra = l.photo_urls.length > 1 ? `\n📷 +${l.photo_urls.length - 1} фото` : "";
  const caption = `🛒 Барахолка #${l.id}\n\n${l.description ?? ""}\n\n👤 ${link}${extra}`.slice(0, 1024);
  const reply_markup = {
    inline_keyboard: [
      [
        { text: tr("uk", "btn_approve"), callback_data: `mpok:${l.id}` },
        { text: tr("uk", "btn_reject"), callback_data: `mpno:${l.id}` },
      ],
    ],
  };

  const chatId = await getSetting("chores_chat_id");
  if (chatId) {
    const threadId = await getSetting("chores_thread_id");
    try {
      await api.sendPhoto(Number(chatId), l.photo_urls[0], {
        caption,
        reply_markup,
        ...(threadId ? { message_thread_id: Number(threadId) } : {}),
      });
      return;
    } catch (e) {
      console.error("postApprovalCard send failed", e);
    }
  }
  // Фолбек: DM усім адмінам із правом marketplace.
  const admins = await getAdminsWithPerm("marketplace");
  for (const a of admins) {
    if (!a.tg_user_id) continue;
    try {
      await api.sendPhoto(a.tg_user_id as number, l.photo_urls[0], { caption, reply_markup });
    } catch {}
  }
}

// Приймає одне фото з гілки продажів (одиночне або член альбому).
// Для одиночного гарантовано є підпис (гард). Для альбому підпис може бути на сусіді.
export async function ingestSalesPhoto(
  api: Api,
  opts: {
    chatId: number;
    messageId: number;
    mediaGroupId: string | null;
    fileId: string;
    fileUniqueId: string;
    caption: string | null;
    seller: SellerInfo;
  },
): Promise<void> {
  const promoTag = (await getSetting("marketplace_promo_tag")) || "#promo";
  const { isPromo, cleaned } = extractPromo(opts.caption, promoTag);

  // ── Альбом: ШВИДКО дозбируємо лише file_id (без завантаження!), потім (з debounce)
  // фіналізуємо. Завантаження відкладене на фіналізацію — інакше повільний download
  // спричиняв гонку: фіналізація сусіда спрацьовувала до запису підпису (Етап 29).
  if (opts.mediaGroupId) {
    await supabase.rpc("mp_collect_album_photo", {
      p_chat_id: opts.chatId,
      p_media_group_id: opts.mediaGroupId,
      p_message_id: opts.messageId,
      p_file_id: opts.fileId,
      p_file_unique_id: opts.fileUniqueId,
      p_description: cleaned,
      p_is_promo: isPromo,
      p_seller_player_id: opts.seller.playerId,
      p_seller_tg_user_id: opts.seller.tgUserId,
      p_seller_tg_username: opts.seller.username,
      p_seller_display: opts.seller.display,
    });
    await new Promise((r) => setTimeout(r, FINALIZE_DELAY_MS));
    await finalizeAlbum(api, opts.chatId, opts.mediaGroupId);
    return;
  }

  // ── Одиночне фото з описом ──
  if (!isPromo) return; // не на сайт; фото лишається в гілці
  const requirePatch = (await getSetting("marketplace_require_patch")) !== "false";
  if (requirePatch && !opts.seller.hasPatch) {
    const hint = (await getSetting("marketplace_patch_hint")) || "";
    await dm(api, opts.seller.tgUserId, tr(opts.seller.lang, "mp_patch_required", { hint }));
    return;
  }
  const up = await downloadAndUpload(api, opts.fileId);
  if (!up) return;
  const { data, error } = await supabase
    .from("marketplace_listings")
    .upsert(
      {
        status: "pending",
        description: cleaned,
        tg_chat_id: opts.chatId,
        tg_message_id: opts.messageId,
        tg_message_ids: [opts.messageId],
        media_group_id: null,
        photo_urls: [up.url],
        storage_paths: [up.path],
        photo_file_unique_ids: [opts.fileUniqueId],
        is_promo: true,
        seller_player_id: opts.seller.playerId,
        seller_tg_user_id: opts.seller.tgUserId,
        seller_tg_username: opts.seller.username,
        seller_display: opts.seller.display,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tg_chat_id,tg_message_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (error || !data) return; // дубль (ретрай вебхука) або помилка → не постимо картку
  await postApprovalCard(api, data.id);
}

// Фіналізація альбому: дочекалися «затишшя» → рівно один воркер вирішує долю оголошення.
async function finalizeAlbum(api: Api, chatId: number, mediaGroupId: string) {
  const { data: row } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("tg_chat_id", chatId)
    .eq("media_group_id", mediaGroupId)
    .maybeSingle();
  if (!row || row.status !== "collecting") return;
  // Прийшло нове фото нещодавно — хай фіналізує наступний виклик.
  if (Date.now() - new Date(row.updated_at).getTime() < QUIET_MS) return;

  // Атомарний клейм: лише один виклик пройде далі.
  const { data: claimed } = await supabase
    .from("marketplace_listings")
    .update({ approval_claimed_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("status", "collecting")
    .is("approval_claimed_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return;

  const seller = await fetchSeller(row.seller_player_id, row.seller_tg_user_id);
  const lang = (seller?.lang as Lang) ?? "uk";

  // Немає опису ніде → весь альбом видаляємо з ТГ + DM, прибираємо файли й рядок.
  if (!row.description) {
    await deleteTgMessages(api, chatId, row.tg_message_ids);
    await removeFiles(row.storage_paths);
    await supabase.from("marketplace_listings").delete().eq("id", row.id);
    await dm(api, row.seller_tg_user_id, tr(lang, "mp_need_caption"));
    return;
  }
  // Є опис, але без #promo → це звичайний контент гілки: лишаємо фото в ТГ, дропаємо рядок.
  if (!row.is_promo) {
    await removeFiles(row.storage_paths);
    await supabase.from("marketplace_listings").delete().eq("id", row.id);
    return;
  }
  // #promo без патча → DM + дропаємо рядок (фото лишається в гілці).
  const requirePatch = (await getSetting("marketplace_require_patch")) !== "false";
  if (requirePatch && !seller?.has_patch) {
    await removeFiles(row.storage_paths);
    await supabase.from("marketplace_listings").delete().eq("id", row.id);
    const hint = (await getSetting("marketplace_patch_hint")) || "";
    await dm(api, row.seller_tg_user_id, tr(lang, "mp_patch_required", { hint }));
    return;
  }
  // #promo + патч → ТЕПЕР завантажуємо всі фото альбому (усі вже зібрані) і публікуємо.
  const urls: string[] = [];
  const paths: string[] = [];
  for (const fid of (row.photo_file_ids ?? []) as string[]) {
    const up = await downloadAndUpload(api, fid);
    if (up) {
      urls.push(up.url);
      paths.push(up.path);
    }
  }
  if (!urls.length) {
    await supabase.from("marketplace_listings").delete().eq("id", row.id);
    return;
  }
  await supabase
    .from("marketplace_listings")
    .update({
      status: "pending",
      photo_urls: urls,
      storage_paths: paths,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  await postApprovalCard(api, row.id);
}

// Знаходить оголошення для /delete: спершу за id повідомлення (відповідь на оригінал),
// інакше за file_unique_id фото (відповідь на репост/пересилку) + автор.
export async function findListingForDelete(
  chatId: number,
  reply: any,
  sellerTgId: number,
): Promise<MarketplaceListing | null> {
  const mid = reply?.message_id;
  const live = ["pending", "approved", "hidden"];
  if (mid) {
    const { data } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("tg_chat_id", chatId)
      .or(`tg_message_id.eq.${mid},tg_message_ids.cs.{${mid}}`)
      .in("status", live)
      .limit(1);
    if (data && data[0]) return data[0] as MarketplaceListing;
  }
  const uids: string[] = (reply?.photo ?? []).map((p: any) => p.file_unique_id).filter(Boolean);
  if (uids.length) {
    const { data } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("tg_chat_id", chatId)
      .eq("seller_tg_user_id", sellerTgId)
      .overlaps("photo_file_unique_ids", uids)
      .in("status", live)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data[0]) return data[0] as MarketplaceListing;
  }
  return null;
}

// Знімає оголошення: статус 'deleted', прибирає файли й (опц.) повідомлення в ТГ.
export async function deleteListing(api: Api, listing: MarketplaceListing, alsoDeleteTg: boolean) {
  await supabase
    .from("marketplace_listings")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", listing.id);
  await removeFiles(listing.storage_paths);
  if (alsoDeleteTg) await deleteTgMessages(api, listing.tg_chat_id, listing.tg_message_ids);
}

// Авто-протермінування (cron): approved старші за marketplace_expiry_days → expired.
export async function expireOldListings(): Promise<number> {
  if ((await getSetting("marketplace_expiry_enabled")) === "false") return 0;
  const days = Number(await getSetting("marketplace_expiry_days")) || 30;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("marketplace_listings")
    .update({ status: "expired" })
    .eq("status", "approved")
    .lt("approved_at", cutoff)
    .select("id");
  return data?.length ?? 0;
}

// Прибирання «завислих» альбомів у статусі collecting (фіналізація не спрацювала).
export async function sweepStuckCollecting(): Promise<number> {
  const cutoff = new Date(Date.now() - STUCK_COLLECTING_MIN * 60000).toISOString();
  const { data } = await supabase
    .from("marketplace_listings")
    .select("id, storage_paths")
    .eq("status", "collecting")
    .lt("created_at", cutoff);
  for (const r of data ?? []) {
    await removeFiles((r as any).storage_paths);
    await supabase.from("marketplace_listings").delete().eq("id", (r as any).id);
  }
  return data?.length ?? 0;
}
