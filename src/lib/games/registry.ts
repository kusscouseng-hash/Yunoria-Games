/** Alle Spiele von Yunoria Games. Neue Spiele: hier eintragen + Regel in game_rules (Datenbank). */
export type GameSlug = "merge" | "snake" | "memory" | "blocks" | "stars";

export type GameCategory = "puzzle" | "action" | "memory";

export type GameInfo = {
  slug: GameSlug;
  title: { en: string; de: string };
  tagline: { en: string; de: string };
  howTo: { en: string; de: string };
  category: GameCategory;
  /** Farben für Kachel und Spielfeld */
  color: string;
  accent: string;
  /** Punkte pro zusätzlichem XP (wie game_rules.score_per_xp) */
  scorePerXp: number;
};

export const GAMES: GameInfo[] = [
  {
    slug: "stars",
    title: { en: "Star Catcher", de: "Sternenfänger" },
    tagline: { en: "Catch falling stars, dodge the meteors.", de: "Fang fallende Sterne, weich den Meteoren aus." },
    howTo: {
      en: "Move with the mouse, your finger or ← →. Stars give points, golden stars give more. Three meteor hits and it's over.",
      de: "Bewegen mit Maus, Finger oder ← →. Sterne geben Punkte, goldene Sterne mehr. Nach drei Meteor-Treffern ist Schluss.",
    },
    category: "action",
    color: "#1b1f4a",
    accent: "#fbbf24",
    scorePerXp: 8,
  },
  {
    slug: "merge",
    title: { en: "Merge Up", de: "Zahlen-Fusion" },
    tagline: { en: "Slide and merge tiles up to 2048 and beyond.", de: "Schiebe und verschmelze Kacheln bis 2048 und weiter." },
    howTo: {
      en: "Swipe or use the arrow keys. Equal numbers merge and add up. The game ends when no move is left.",
      de: "Wischen oder Pfeiltasten. Gleiche Zahlen verschmelzen und werden addiert. Das Spiel endet, wenn kein Zug mehr geht.",
    },
    category: "puzzle",
    color: "#3b1d14",
    accent: "#fb923c",
    scorePerXp: 400,
  },
  {
    slug: "snake",
    title: { en: "Neon Snake", de: "Neon-Schlange" },
    tagline: { en: "Eat, grow, don't bite your own tail.", de: "Fressen, wachsen, nicht in den eigenen Schwanz beißen." },
    howTo: {
      en: "Steer with the arrow keys, WASD or by swiping. Every orb makes you longer and faster.",
      de: "Steuern mit Pfeiltasten, WASD oder Wischen. Jede Kugel macht dich länger und schneller.",
    },
    category: "action",
    color: "#0c2e22",
    accent: "#34d399",
    scorePerXp: 40,
  },
  {
    slug: "blocks",
    title: { en: "Block Drop", de: "Block-Fall" },
    tagline: { en: "Stack falling blocks and clear lines.", de: "Staple fallende Blöcke und räume Reihen ab." },
    howTo: {
      en: "← → move, ↑ rotate, ↓ drop faster, space drops instantly. On touch: buttons below the field.",
      de: "← → bewegen, ↑ drehen, ↓ schneller, Leertaste sofort ablegen. Am Handy: Knöpfe unter dem Feld.",
    },
    category: "puzzle",
    color: "#1e1b3a",
    accent: "#a78bfa",
    scorePerXp: 300,
  },
  {
    slug: "memory",
    title: { en: "Rune Memory", de: "Runen-Memory" },
    tagline: { en: "Find all pairs as fast as you can.", de: "Finde alle Paare so schnell du kannst." },
    howTo: {
      en: "Flip two cards. Matching runes stay open. Fewer moves and less time give more points.",
      de: "Decke zwei Karten auf. Gleiche Runen bleiben offen. Weniger Züge und weniger Zeit geben mehr Punkte.",
    },
    category: "memory",
    color: "#12324a",
    accent: "#38bdf8",
    scorePerXp: 60,
  },
];

export const GAME_OF_THE_WEEK: GameSlug = "stars";

export function getGame(slug: string): GameInfo | undefined {
  return GAMES.find((g) => g.slug === slug);
}
