import { supabase } from "./supabase";

// Облік членства в групі (etap8.sql). Лише запис у БД — без Telegram API
// (перевірку «зараз у групі» робить бот через getChatMember).

// Записати, що користувача бачили як члена групи (повідомлення/капча/вступ).
export async function recordMemberSeen(tgUserId: number): Promise<void> {
  if (!tgUserId) return;
  await supabase.from("group_members").upsert(
    { tg_user_id: tgUserId, status: "member", last_seen: new Date().toISOString() },
    { onConflict: "tg_user_id" },
  );
}

// Позначити вихід із групи (зберігаємо left_at назавжди — сигнал для анти-абузу).
export async function recordMemberLeft(tgUserId: number): Promise<void> {
  if (!tgUserId) return;
  await supabase.from("group_members").upsert(
    { tg_user_id: tgUserId, status: "left", left_at: new Date().toISOString() },
    { onConflict: "tg_user_id" },
  );
}

// Чи виходив користувач із групи раніше (тоді реф-бонус за нього не нараховуємо).
export async function hasEverLeft(tgUserId: number): Promise<boolean> {
  if (!tgUserId) return false;
  const { data } = await supabase
    .from("group_members")
    .select("left_at")
    .eq("tg_user_id", tgUserId)
    .maybeSingle();
  return !!data?.left_at;
}
