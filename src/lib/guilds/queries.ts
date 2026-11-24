import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { isGameRankSystem } from "@/lib/game-ranks";
import type { GuildColor, GuildRow } from "@/lib/supabase/database.types";

/** Mindest-Level zum Gründen (steht in der Datenbank, Standard 100). */
export const GUILD_MIN_LEVEL = 100;
export const GUILD_MEMBER_LIMIT = 30;

export type GuildTagInfo = { tag: string; name: string; emblem: string; color: GuildColor; image: string | null; role: string };

/** Gilden-Kürzel für mehrere Nutzer (für Ranglisten, Kommentare, Profile). Fehlt Migration 16 → leer. */
export async function guildTagsFor(userIds: string[]): Promise<Map<string, GuildTagInfo>> {
  const out = new Map<string, GuildTagInfo>();
  if (userIds.length === 0) return out;
  const supabase = createPublicClient();
  const { data: members, error } = await supabase.from("guild_members").select("user_id, guild_id, role").in("user_id", userIds);
  if (error || !members?.length) return out;
  const { data: guilds } = await supabase.from("guilds").select("*").in("id", [...new Set(members.map((m) => m.guild_id))]);
  const byId = new Map((guilds ?? []).map((g) => [g.id, g]));
  for (const m of members) {
    const g = byId.get(m.guild_id);
    if (g) out.set(m.user_id, { tag: g.tag, name: g.name, emblem: g.emblem, color: g.color, image: g.image_url ?? null, role: m.role });
  }
  return out;
}

export async function getGuildByTag(tag: string): Promise<GuildRow | null> {
  if (!/^[A-Za-z0-9]{2,5}$/.test(tag)) return null;
  const { data } = await createPublicClient().from("guilds").select("*").eq("tag", tag.toUpperCase()).maybeSingle();
  return data;
}

/** Gilden-Turnier von Yunoria Games: Rangliste nach Spiele-XP der Mitglieder. */
export async function getGuildBoard(period: string, limit = 50) {
  const { data, error } = await createPublicClient().rpc("game_guild_leaderboard", { p_period: period, p_limit: limit });
  return error ? null : (data ?? []).map((g) => ({ ...g, emblem: "", color: g.color as GuildColor }));
}

/** Mitgliederliste mit Spiele-XP (Level und Rang kommen aus den Spielen, nicht vom Lesen). */
export async function getGuildRoster(guildId: string, period = "all") {
  const client = createPublicClient();
  const { data } = await client.rpc("guild_roster", { p_guild: guildId, p_period: period });
  const roster = data ?? [];
  if (!roster.length) return [];
  const { data: games } = await client.from("game_profiles").select("user_id, xp, rank_system").in("user_id", roster.map((m) => m.user_id));
  const byId = new Map((games ?? []).map((g) => [g.user_id, g]));
  return roster
    .map((m) => {
      const g = byId.get(m.user_id);
      return { ...m, game_xp: g?.xp ?? 0, game_rank_system: g && isGameRankSystem(g.rank_system) ? g.rank_system : ("league" as const) };
    })
    .sort((a, b) => b.game_xp - a.game_xp);
}
