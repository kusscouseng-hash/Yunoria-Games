"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getGame } from "./registry";

export type SubmitResult =
  | { ok: true; xp: number; totalXp: number; todayXp: number; dailyCap: number; best: number; newBest: boolean }
  | { ok: false; error: "signin" | "too_fast" | "implausible" | "generic" };

/** Runde einreichen – die Datenbank prüft Plausibilität, Tempo und Tageslimit. */
export async function submitScore(game: string, score: number, durationMs: number): Promise<SubmitResult> {
  if (!getGame(game) || !Number.isFinite(score) || !Number.isFinite(durationMs)) return { ok: false, error: "generic" };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { ok: false, error: "signin" };
  const { data, error } = await supabase.rpc("submit_game_score", {
    p_game: game,
    p_score: Math.max(0, Math.floor(score)),
    p_duration_ms: Math.max(0, Math.floor(durationMs)),
  });
  if (error || !data) {
    const m = error?.message ?? "";
    return { ok: false, error: m.includes("too_fast") ? "too_fast" : m.includes("implausible") ? "implausible" : "generic" };
  }
  refresh();
  const d = data as { xp: number; total_xp: number; today_xp: number; daily_cap: number; best: number; new_best: boolean };
  return { ok: true, xp: d.xp, totalXp: d.total_xp, todayXp: d.today_xp, dailyCap: d.daily_cap, best: d.best, newBest: d.new_best };
}
