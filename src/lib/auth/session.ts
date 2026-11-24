import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { RankSystemId } from "@/lib/ranks";
import { isGameRankSystem, type GameRankSystemId } from "@/lib/game-ranks";

export type CurrentUser = {
  id: string;
  email: string | null;
  username: string;
  avatarUrl: string | null;
  rankSystem: RankSystemId;
  /** Summe aller Systeme (Gesamt-Rangliste) */
  totalXp: number;
  /** XP pro Rangsystem – Level wird immer aus dem aktuellen System berechnet */
  systemXp: Record<RankSystemId, number>;
  /** XP im aktuell gewählten System */
  currentXp: number;
  selectedTitle: string | null;
  isOwner: boolean;
  /** Zeichner-Konto (Studio) – vom Admin vergeben */
  isCreator: boolean;
  bio: string | null;
  createdAt: string;
  subscriptionTier: "free" | "plus" | "premium";
  role: "user" | "moderator" | "admin";
  /** Spiele-XP (getrennt von den Lese-XP) */
  gameXp: number;
  gameRankSystem: GameRankSystemId;
};

/**
 * Aktuell angemeldeter Nutzer inkl. Profil – oder null.
 * Prüft das Token (getClaims) statt den Cookies blind zu vertrauen.
 * Nur innerhalb von <Suspense> verwenden (liest Cookies).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  const userId = data.claims.sub;
  const { data: profile } = await supabase
    .from("profiles")
    // "*" statt fester Spalten: funktioniert auch, bevor neue Spalten per Migration dazukommen
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const systemXp: Record<RankSystemId, number> = { hunter: 0, cultivation: 0, mage: 0, knight: 0 };
  const { data: perSystem, error: sysErr } = await supabase.from("profile_system_xp").select("rank_system, xp").eq("user_id", userId);
  if (sysErr) systemXp[profile.rank_system] = profile.total_xp; // Migration noch nicht ausgeführt: alles im aktuellen System
  else for (const r of perSystem ?? []) systemXp[r.rank_system] = r.xp;

  // Spiele-Profil (fehlt, solange die Migration noch nicht lief oder noch nie gespielt wurde)
  const { data: game } = await supabase.from("game_profiles").select("xp, rank_system").eq("user_id", userId).maybeSingle();

  return {
    id: userId,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    rankSystem: profile.rank_system,
    totalXp: profile.total_xp,
    systemXp,
    currentXp: systemXp[profile.rank_system],
    selectedTitle: profile.selected_title ?? null,
    isOwner: Boolean(profile.is_owner),
    isCreator: Boolean(profile.is_creator),
    bio: profile.bio ?? null,
    createdAt: profile.created_at,
    subscriptionTier: profile.subscription_tier,
    role: profile.role,
    gameXp: game?.xp ?? 0,
    gameRankSystem: isGameRankSystem(game?.rank_system) ? game.rank_system : "league",
  };
});
