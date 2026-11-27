import "server-only";
import { cacheLife } from "next/cache";
import { BLOCKED_WORDS, guessCategory, type ArcadeCategory, type ArcadeGame } from "./types";

/**
 * Spiele von GamePix (lizenzierter Spiele-Vertrieb, Werbung läuft über GamePix
 * mit Umsatzbeteiligung). Ohne eigene Partner-ID (GAMEPIX_SID) bleibt der Bereich aus.
 * Doku: https://docs.gamepix.com/docs
 */

/** Bekannte GamePix-Kategorien; alle anderen werden über guessCategory() zugeordnet. */
export const ARCADE_CATEGORIES = [
  "puzzle",
  "match-3",
  "2048",
  "casual",
  "arcade",
  "hyper-casual",
  "racing",
  "driving",
  "sports",
  "soccer",
  "ball",
  "memory",
  "trivia",
  "math",
  "educational",
  "drawing",
  "hidden-object",
  "animal",
  "cats",
  "farming",
  "building",
  "simulation",
  "strategy",
  "adventure",
  "fun",
] as const;
export type GamepixCategory = (typeof ARCADE_CATEGORIES)[number];

/** GamePix-Kategorie → unsere Kategorie */
const TO_SITE: Record<GamepixCategory, ArcadeCategory> = {
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
const isGamepixCategory = (c: string): c is GamepixCategory => c in TO_SITE;

export function gamepixSid(): string | null {
  const sid = process.env.GAMEPIX_SID?.trim();
  return sid && /^[A-Za-z0-9_-]{1,64}$/.test(sid) ? sid : null;
}

export function embedUrl(namespace: string, sid: string): string {
  return `https://play.gamepix.com/${encodeURIComponent(namespace)}/embed?sid=${encodeURIComponent(sid)}`;
}

type FeedItem = {
  id: string;
  title: string;
  namespace: string;
  description?: string;
  category: string;
  orientation: string;
  width: number;
  height: number;
  banner_image: string;
  image: string;
  date_published?: string;
};

const PAGES = 8; // 8 × 96 = die 768 bestbewerteten Spiele (Auswahl im Admin-Bereich)

/** Lädt die bestbewerteten Spiele (zwischengespeichert, höchstens alle paar Stunden neu). */
export async function getArcadeCatalog(sid: string): Promise<ArcadeGame[]> {
  "use cache";
  cacheLife("hours");
  const out: ArcadeGame[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= PAGES; page++) {
    const res = await fetch(`https://feeds.gamepix.com/v2/json?order=quality&pagination=96&page=${page}&sid=${encodeURIComponent(sid)}`);
    if (!res.ok) break;
    const data = (await res.json()) as { items?: FeedItem[] };
    for (const it of data.items ?? []) {
      if (!it?.namespace || seen.has(it.namespace) || !it.category) continue;
      if (BLOCKED_WORDS.test(`${it.title} ${it.description ?? ""}`)) continue;
      if (!/^[a-z0-9-]+$/.test(it.namespace) || it.namespace.startsWith("gd-") || !it.banner_image?.startsWith("https://img.gamepix.com/")) continue;
      seen.add(it.namespace);
      const banner = it.banner_image.replace(/\?w=\d+/, "?w=480");
      const icon = String(it.image ?? "").replace(/\?w=\d+/, "?w=400");
      out.push({
        source: "gpx",
        id: it.namespace,
        title: String(it.title).slice(0, 80),
        description: String(it.description ?? "").slice(0, 400),
        category: isGamepixCategory(it.category) ? TO_SITE[it.category] : guessCategory(`${it.category} ${it.title}`),
        width: Number(it.width) || 800,
        height: Number(it.height) || 600,
        banner,
        icon: icon.startsWith("https://img.gamepix.com/") ? icon : banner,
        published: Date.parse(it.date_published ?? "") || 0,
      });
    }
  }
  return out;
}
