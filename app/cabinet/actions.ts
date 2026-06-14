"use server";

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase-server";
import { featureEnabled } from "@/lib/settings";
import { redeemLinkCode } from "@/lib/identities";

export type LinkState = { error?: string };

const REASON_KEY: Record<string, string> = {
  not_found: "link_err_not_found",
  expired: "link_err_expired",
  used: "link_err_used",
  taken: "link_err_taken",
};

// Прив'язка email-сесії до TG-профілю за одноразовим кодом із бота (/linksite).
export async function linkTelegram(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  if (!(await featureEnabled("site_link"))) return { error: "auth_err_generic" };

  const code = String(formData.get("code") ?? "");
  const res = await redeemLinkCode(code, user.id);
  if (!res.ok) return { error: REASON_KEY[res.reason] ?? "auth_err_generic" };

  redirect("/cabinet?linked=1");
}
