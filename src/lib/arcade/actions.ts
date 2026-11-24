"use server";

import { createClient } from "@/lib/supabase/server";

export type ArcadeClaim =
  | { ok: true; xp: number; todayArcade: number; cap: number; capped: boolean }
  | { ok: false; error: "signin" | "too_fast" | "generic" };

/** Eine Minute Spielzeit melden – die Datenbank prüft Tempo und Tageslimit (30 XP). */
export async function claimArcadeMinute(): Promise<ArcadeClaim> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { ok: false, error: "signin" };
  const { data, error } = await supabase.rpc("claim_arcade_minute");
  if (error || !data) return { ok: false, error: error?.message?.includes("too_fast") ? "too_fast" : "generic" };
  const d = data as { xp: number; today_arcade: number; cap: number; capped: boolean };
  return { ok: true, xp: d.xp, todayArcade: d.today_arcade, cap: d.cap, capped: d.capped };
}
