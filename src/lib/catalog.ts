import "server-only";
import { withLocale, type Locale } from "@/i18n/config";
import { getArcadeCatalog, gamepixSid, type ArcadeGame } from "@/lib/arcade/gamepix";
import { GAMES, type GameInfo, type GameSlug } from "@/lib/games/registry";

/**
 * Ein gemeinsamer Spielekatalog für die ganze Seite: eigene Spiele („Originals“)
 * plus die eingebetteten GamePix-Spiele, sortiert in unsere eigenen Kategorien.
 */
export const SITE_CATEGORIES = ["action", "puzzle", "racing", "sports", "brain", "casual", "creative", "animals", "strategy"] as const;
export type SiteCategory = (typeof SITE_CATEGORIES)[number];

/** Sammlungen in der Seitenleiste neben den Kategorien */
export const COLLECTIONS = ["new", "popular", "originals"] as const;
export type Collection = (typeof COLLECTIONS)[number];

export const CATEGORY_ICON: Record<SiteCategory | Collection, string> = {
  new: "✨",
  popular: "🔥",
  originals: "⭐",
  action: "⚡",
  puzzle: "🧩",
  racing: "🏎️",
  sports: "⚽",
  brain: "🧠",
  casual: "🎈",
  creative: "🎨",
  animals: "🐾",
  strategy: "♟️",
};

/** Bunte Farbe je Kategorie (Symbol-Hintergrund in Seitenleiste und Überschriften) */
export const CATEGORY_TINT: Record<SiteCategory | Collection, string> = {
  new: "#facc15",
  popular: "#fb923c",
  originals: "#a78bfa",
  action: "#fb7185",
  puzzle: "#34d399",
  racing: "#60a5fa",
  sports: "#4ade80",
  brain: "#f472b6",
  casual: "#22d3ee",
  creative: "#fbbf24",
  animals: "#a3e635",
  strategy: "#c084fc",
};

const ARCADE_TO_SITE: Record<string, SiteCategory> = {
  arcade: "action",
  "hyper-casual": "action",
  puzzle: "puzzle",
  "match-3": "puzzle",
  "2048": "puzzle",
  "hidden-object": "puzzle",
  racing: "racing",
  driving: "racing",
  sports: "sports",
  soccer: "sports",
  ball: "sports",
  memory: "brain",
  trivia: "brain",
  math: "brain",
  educational: "brain",
  casual: "casual",
  fun: "casual",
  drawing: "creative",
  building: "creative",
  animal: "animals",
  cats: "animals",
  farming: "animals",
  strategy: "strategy",
  simulation: "strategy",
  adventure: "strategy",
};

const OWN_TO_SITE: Record<GameInfo["category"], SiteCategory> = {
  action: "action",
  puzzle: "puzzle",
  memory: "brain",
};

export type Tile =
  | {
      kind: "own";
      key: string;
      href: string;
      title: string;
      category: SiteCategory;
      slug: GameSlug;
      color: string;
      accent: string;
      tagline: string;
    }
  | {
      kind: "arcade";
      key: string;
      href: string;
      title: string;
      category: SiteCategory;
      icon: string;
      cover: string;
      published: number;
      description: string;
      game: ArcadeGame;
    };

export function isSiteCategory(v: string): v is SiteCategory {
  return (SITE_CATEGORIES as readonly string[]).includes(v);
}
export function isCollection(v: string): v is Collection {
  return (COLLECTIONS as readonly string[]).includes(v);
}

export function ownTiles(locale: Locale): Tile[] {
  return GAMES.map((g) => ({
    kind: "own" as const,
    key: `own:${g.slug}`,
    href: withLocale(locale, `/play/${g.slug}`),
    title: g.title[locale],
    category: OWN_TO_SITE[g.category],
    slug: g.slug,
    color: g.color,
    accent: g.accent,
    tagline: g.tagline[locale],
  }));
}

export async function arcadeTiles(locale: Locale): Promise<Tile[]> {
  const sid = gamepixSid();
  if (!sid) return [];
  const games = await getArcadeCatalog(sid);
  return games
    .filter((g) => ARCADE_TO_SITE[g.category])
    .map((g) => ({
      kind: "arcade" as const,
      key: `gpx:${g.namespace}`,
      href: withLocale(locale, `/arcade/${g.namespace}`),
      title: g.title,
      category: ARCADE_TO_SITE[g.category],
      icon: g.icon.startsWith("https://img.gamepix.com/") ? g.icon : g.banner,
      cover: g.banner,
      published: g.published,
      description: g.description,
      game: g,
    }));
}

/** Alle Spiele: eigene zuerst, dann GamePix nach Bewertung */
export async function allTiles(locale: Locale): Promise<{ own: Tile[]; arcade: Tile[]; all: Tile[] }> {
  const own = ownTiles(locale);
  const arcade = await arcadeTiles(locale);
  return { own, arcade, all: [...own, ...arcade] };
}

export function newest(tiles: Tile[]): Tile[] {
  return [...tiles].filter((t) => t.kind === "arcade").sort((a, b) => (b.kind === "arcade" ? b.published : 0) - (a.kind === "arcade" ? a.published : 0));
}

export function byCategory(tiles: Tile[], cat: SiteCategory): Tile[] {
  return tiles.filter((t) => t.category === cat);
}

/** Tiles für eine Seitenleisten-Seite (Kategorie oder Sammlung) */
export function forListing(slug: SiteCategory | Collection, data: { own: Tile[]; arcade: Tile[]; all: Tile[] }): Tile[] {
  if (slug === "originals") return data.own;
  if (slug === "new") return newest(data.all);
  if (slug === "popular") return data.all;
  return byCategory(data.all, slug);
}

export function searchTiles(tiles: Tile[], q: string): Tile[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  return tiles.filter((t) => t.title.toLowerCase().includes(needle));
}
