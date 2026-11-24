/**
 * Spiele-Rangsysteme von Yunoria Games.
 * Wie bei Yunoria Scans: alle Systeme nutzen dasselbe Level, nur die Namen ändern sich.
 * Gleiche Schwellen (ab Level 1, 5, 10, 20, 35, 55, 80, 100).
 */
export type GameRankSystemId = "league" | "arcade" | "ninja" | "space";

export const GAME_RANK_IDS: GameRankSystemId[] = ["league", "arcade", "ninja", "space"];

const TIER_LEVELS = [1, 5, 10, 20, 35, 55, 80, 100] as const;

export type GameRankSystem = { id: GameRankSystemId; label: string; ranks: ReadonlyArray<{ name: string; minLevel: number }> };

const tiers = (names: readonly string[]) => names.map((name, i) => ({ name, minLevel: TIER_LEVELS[i] }));

export const GAME_RANK_SYSTEMS: Record<GameRankSystemId, GameRankSystem> = {
  league: { id: "league", label: "League", ranks: tiers(["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Legend"]) },
  arcade: { id: "arcade", label: "Arcade", ranks: tiers(["Rookie", "Player", "Challenger", "High Scorer", "Pro", "Champion", "Arcade Hero", "Arcade Legend"]) },
  ninja: { id: "ninja", label: "Ninja", ranks: tiers(["Initiate", "Shinobi", "Shadow Runner", "Blade", "Silent Fang", "Phantom", "Shadow Master", "Shadow Legend"]) },
  space: { id: "space", label: "Space", ranks: tiers(["Cadet", "Pilot", "Navigator", "Captain", "Commander", "Admiral", "Star Marshal", "Galaxy Legend"]) },
};

export function isGameRankSystem(v: unknown): v is GameRankSystemId {
  return typeof v === "string" && (GAME_RANK_IDS as string[]).includes(v);
}

export function gameRankForLevel(system: GameRankSystemId, level: number) {
  const ranks = GAME_RANK_SYSTEMS[system].ranks;
  let index = 0;
  for (let i = 0; i < ranks.length; i++) if (level >= ranks[i].minLevel) index = i;
  return { current: ranks[index], next: ranks[index + 1] ?? null, index, total: ranks.length };
}
