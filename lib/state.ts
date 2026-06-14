import { supabase } from "./supabase";

// Простий стан покрокових діалогів у боті (зберігається в БД, бо serverless).
export async function getState(
  tgUserId: number,
): Promise<{ state: string | null; data: Record<string, any> }> {
  const { data } = await supabase
    .from("user_states")
    .select("state,data")
    .eq("tg_user_id", tgUserId)
    .maybeSingle();
  return { state: data?.state ?? null, data: (data?.data as Record<string, any>) ?? {} };
}

export async function setState(
  tgUserId: number,
  state: string,
  data: Record<string, unknown> = {},
) {
  await supabase
    .from("user_states")
    .upsert(
      { tg_user_id: tgUserId, state, data, updated_at: new Date().toISOString() },
      { onConflict: "tg_user_id" },
    );
}

export async function clearState(tgUserId: number) {
  await supabase.from("user_states").delete().eq("tg_user_id", tgUserId);
}
