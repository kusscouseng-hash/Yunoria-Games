/**
 * Reader-Rangsysteme.
 * Alle Systeme basieren auf demselben Level – nur Bezeichnung und Darstellung ändern sich.
 * Schwellen = ab welchem Level ein Rang erreicht wird (vom Inhaber bestätigt, 2026-11-17).
 * Alle vier Systeme haben einen Spitzenrang ab Level 100.
 */
export type RankSystemId = "hunter" | "cultivation" | "mage" | "knight";

export type RankSystem = {
  id: RankSystemId;
  label: string;
  ranks: ReadonlyArray<{ name: string; minLevel: number }>;
};

// 7 Ränge laut Master-Prompt + ein 8. Spitzenrang ab Level 100 (Wunsch des Inhabers, 2026-11-17)
const TIER_LEVELS = [1, 5, 10, 20, 35, 55, 80, 100] as const;

function tiers(names: readonly string[]) {
  return names.map((name, i) => ({ name, minLevel: TIER_LEVELS[i] }));
}

export const RANK_SYSTEMS: Record<RankSystemId, RankSystem> = {
  hunter: {
    id: "hunter",
    label: "Hunter",
    ranks: [
      { name: "E", minLevel: 1 },
      { name: "D", minLevel: 5 },
      { name: "C", minLevel: 10 },
      { name: "B", minLevel: 20 },
      { name: "A", minLevel: 35 },
      { name: "S", minLevel: 50 },
      { name: "SS", minLevel: 70 },
      { name: "SSS", minLevel: 100 },
    ],
  },
  cultivation: {
    id: "cultivation",
    label: "Cultivation",
    ranks: tiers([
      "Qi Gathering",
      "Foundation Establishment",
      "Core Formation",
      "Golden Core",
      "Nascent Soul",
      "Soul Transformation",
      "Ascension",
      "Immortal Emperor",
    ]),
  },
  mage: {
    id: "mage",
    label: "Mage",
    ranks: tiers([
      "Apprentice",
      "Novice Mage",
      "Adept Mage",
      "Advanced Mage",
      "Archmage",
      "Grand Magus",
      "Legendary Mage",
      "Arcane Sovereign",
    ]),
  },
  knight: {
    id: "knight",
    label: "Knight",
    ranks: tiers([
      "Squire",
      "Knight",
      "Elite Knight",
      "Royal Knight",
      "Knight Commander",
      "Grand Knight",
      "Legendary Knight",
      "Eternal Paladin",
    ]),
  },
};

/**
 * Besondere Farbe für die obersten Ränge (gilt in allen Systemen):
 * letzter Rang = leuchtendes Karmesinrot, vorletzter = Gold, drittletzter = Lila.
 * Der eigene aktuelle Rang wird zusätzlich separat (rot hinterlegt) markiert.
 */
export type RankTier = "legendary" | "gold" | "purple" | null;

export function rankTier(index: number, total: number): RankTier {
  const fromTop = total - 1 - index;
  if (fromTop === 0) return "legendary";
  if (fromTop === 1) return "gold";
  if (fromTop === 2) return "purple";
  return null;
}
