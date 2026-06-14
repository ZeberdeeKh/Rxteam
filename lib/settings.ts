import { supabase } from "./supabase";

export async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string | undefined) ?? null;
}

export async function setSetting(key: string, value: string) {
  await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

// Перемикач функції (за замовчуванням — увімкнено).
export async function featureEnabled(key: string): Promise<boolean> {
  const v = await getSetting(`feature_${key}`);
  return v === null ? true : v !== "false";
}
