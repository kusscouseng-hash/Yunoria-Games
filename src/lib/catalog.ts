import "server-only";
import { withLocale, type Locale } from "@/i18n/config";
import { activeSources, getPicks, providerCatalog } from "@/lib/arcade/sources";
import type { ArcadeGame } from "@/lib/arcade/types";
import { OWN_GAMES_ENABLED, VISIBLE_GAMES, type GameInfo, type GameSlug } from "@/lib/games/registry";

/**
 * Ein gemeinsamer Spielekatalog für die ganze Seite: eigene Spiele („Originals“)
 * plus die handverlesenen Partner-Spiele (GamePix, GameDistribution) in unseren eigenen Kategorien.
 */
export const SITE_CATEGORIES = ["action", "puzzle", "racing", "sports", "brain", "casual", "creative", "animals", "strategy"] as const;
export type SiteCategory = (typeof SITE_CATEGORIES)[number];

/** Sammlungen in der Seitenleiste neben den Kategorien */
const ALL_COLLECTIONS = ["new", "popular", "originals"] as const;
export type Collection = (typeof ALL_COLLECTIONS)[number];
export const COLLECTIONS: readonly Collection[] = OWN_GAMES_ENABLED ? ALL_COLLECTIONS : ALL_COLLECTIONS.filter((c) => c !== "originals");

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
  return VISIBLE_GAMES.map((g) => ({
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

/**
 * Partner-Spiele für die öffentliche Seite: die handverlesene Auswahl aus dem Admin-Bereich.
 * Solange noch nichts ausgewählt ist, wie bisher die bestbewerteten GamePix-Spiele.
 */
export async function arcadeTiles(locale: Locale): Promise<Tile[]> {
  const active = activeSources();
  if (active.length === 0) return [];
  const picks = await getPicks();
  const games = picks && picks.length > 0 ? picks.filter((g) => active.includes(g.source)) : await providerCatalog("gpx");
  return games.map((g) => ({
    kind: "arcade" as const,
    key: `${g.source}:${g.id}`,
    href: withLocale(locale, `/arcade/${g.id}`),
    title: g.title,
    category: g.category,
    icon: g.icon,
    cover: g.banner,
    published: g.published,
    description: g.description,
    game: g,
  }));
}

/** Alle Spiele: eigene zuerst, dann die Partner-Spiele */
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
