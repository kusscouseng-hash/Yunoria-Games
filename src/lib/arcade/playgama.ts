import "server-only";
import catalog from "@/data/playgama.json";
import { BLOCKED_WORDS, type ArcadeCategory, type ArcadeGame } from "./types";

/**
 * Spiele von Playgama Partners (lizenzierter Spiele-Vertrieb, Werbung läuft über Playgama,
 * bis zu 50 % Umsatzbeteiligung). Die Spieleliste liegt als Datei in src/data/playgama.json
 * (Export aus dem Playgama-Partnerbereich, gekürzt). Neue Spiele: Export neu herunterladen
 * und Claude die Datei umwandeln lassen.
 * Die Partner-Nummer (clid) steht ohnehin öffentlich in jedem eingebetteten Spiel.
 * Ausschalten: PLAYGAMA_ENABLED=false in Vercel.
 */
const DEFAULT_CLID = "p_55e1b2a7-85d9-4ff2-b2c1-69599a4bf68a";

export function playgamaClid(): string | null {
  if (process.env.PLAYGAMA_ENABLED?.trim().toLowerCase() === "false") return null;
  const clid = (process.env.PLAYGAMA_CLID ?? DEFAULT_CLID).trim();
  return /^[A-Za-z0-9_-]{1,80}$/.test(clid) ? clid : null;
}

type Entry = { s: string; t: string; d: string; g: string[]; b: string; i: string; o: string };

/** Playgama-Genres → unsere Kategorie (erste passende Regel gewinnt) */
const RULES: [RegExp, ArcadeCategory][] = [
  [/^(racing|car-racing|driving|car|cars|drift|moto|bike|truck|parking)$/, "racing"],
  [/^(sports|ball|soccer|football|basketball|golf|tennis|billiards|bowling|hockey)$/, "sports"],
  [/^(animals|cats|dogs|pets|horse|farm)$/, "animals"],
  [/^(drawing|coloring|fashion|decoration|dress-up|makeup|crafting|art|music|cooking|food)$/, "creative"],
  [/^(quiz|trivia|educational|math|words|word|brain|memory)$/, "brain"],
  [/^(puzzle|matching|match-3|merge|logic|blocks|mahjong|jigsaw|sorting|hidden-objects|bubble)$/, "puzzle"],
  [/^(strategy|tower-defense|management|tycoon|simulation|idle|economic|rpg|cards|board)$/, "strategy"],
  [/^(action|shooting|first-person-shooter|arcade|obby|platform|running|runner|survival|fighting|zombie|horror|io|multiplayer|ragdoll|skill)$/, "action"],
];

function categoryOf(genres: string[]): ArcadeCategory {
  for (const [re, cat] of RULES) if (genres.some((g) => re.test(g))) return cat;
  return "casual";
}

export function pgId(slug: string): string {
  return `pg-${slug.toLowerCase()}`;
}

/** Original-Schreibweise des Slugs (Groß-/Kleinschreibung zählt bei Playgama) */
const SLUGS = new Map((catalog as Entry[]).map((e) => [pgId(e.s), e.s]));

export function pgEmbedUrl(id: string, clid: string): string | null {
  const slug = SLUGS.get(id);
  return slug ? `https://playgama.com/export/game/${encodeURIComponent(slug)}?clid=${encodeURIComponent(clid)}` : null;
}

let cached: ArcadeGame[] | null = null;

/** Alle Playgama-Spiele (Reihenfolge = Beliebtheit bei Playgama), nur Glücksspiel bleibt draußen */
export function getPlaygamaCatalog(): ArcadeGame[] {
  if (cached) return cached;
  const now = Date.now();
  cached = (catalog as Entry[])
    .filter((e) => e.b.startsWith("https://static.playgama.com/") && e.i.startsWith("https://static.playgama.com/"))
    .filter((e) => !e.g.includes("casino") && !BLOCKED_WORDS.test(`${e.t} ${e.d}`))
    .map((e, rank) => ({
      source: "pg" as const,
      id: pgId(e.s),
      title: e.t.slice(0, 80) || e.s,
      description: e.d,
      category: categoryOf(e.g),
      width: e.o === "v" ? 720 : 1280,
      height: e.o === "v" ? 1280 : 720,
      banner: e.b,
      icon: e.i,
      published: now - rank * 60_000,
    }));
  return cached;
}
