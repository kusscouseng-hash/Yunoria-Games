import "server-only";
import { cacheLife } from "next/cache";

/**
 * Spiele von GamePix (lizenzierter Spiele-Vertrieb, Werbung läuft über GamePix
 * mit Umsatzbeteiligung). Ohne eigene Partner-ID (GAMEPIX_SID) bleibt der Bereich aus.
 * Doku: https://docs.gamepix.com/docs
 */
export type ArcadeGame = {
  id: string;
  namespace: string;
  title: string;
  description: string;
  category: string;
  orientation: string;
  width: number;
  height: number;
  banner: string;
  icon: string;
};

/** Familienfreundliche Kategorien – Ballern, Krieg, Zombies, Kämpfe usw. bleiben draußen. */
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
export type ArcadeCategory = (typeof ARCADE_CATEGORIES)[number];
const ALLOWED = new Set<string>(ARCADE_CATEGORIES);

/** Titel/Beschreibungen mit diesen Wörtern werden zusätzlich ausgefiltert. */
const BLOCKED_WORDS =
  /\b(gun|guns|sniper|shoot\w*|shooter|kill\w*|blood\w*|zombie\w*|war|warfare|army|horror|scary|gore|weapon\w*|bomb\w*|dating|kiss\w*|girlfriend|boyfriend|sexy|casino|gambl\w*|slots?|poker|bet|betting|prank|fight\w*|battle\w*|knife|assassin\w*|murder\w*)\b/i;

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
};

const PAGES = 4; // 4 × 96 = die 384 bestbewerteten Spiele

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
      if (!it?.namespace || seen.has(it.namespace) || !ALLOWED.has(it.category)) continue;
      if (BLOCKED_WORDS.test(`${it.title} ${it.description ?? ""}`)) continue;
      if (!/^[a-z0-9-]+$/.test(it.namespace) || !it.banner_image?.startsWith("https://img.gamepix.com/")) continue;
      seen.add(it.namespace);
      out.push({
        id: String(it.id),
        namespace: it.namespace,
        title: String(it.title).slice(0, 80),
        description: String(it.description ?? "").slice(0, 400),
        category: it.category,
        orientation: it.orientation,
        width: Number(it.width) || 800,
        height: Number(it.height) || 600,
        banner: it.banner_image.replace(/\?w=\d+/, "?w=480"),
        icon: it.image,
      });
    }
  }
  return out;
}
