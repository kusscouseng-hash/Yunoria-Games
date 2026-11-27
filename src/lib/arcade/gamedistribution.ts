import "server-only";
import { cacheLife } from "next/cache";
import { BLOCKED_WORDS, guessCategory, type ArcadeCategory, type ArcadeGame } from "./types";

/**
 * Spiele von GameDistribution (lizenzierter Spiele-Vertrieb von Azerion; Werbung läuft über
 * GameDistribution mit Umsatzbeteiligung für Publisher). Der Katalog ist öffentlich lesbar.
 * Damit Einnahmen deinem Konto zugeordnet werden, die eigene Domain als Publisher bei
 * GameDistribution anmelden (https://gamedistribution.com/publishers).
 * Ausschalten: GAMEDISTRIBUTION_ENABLED=false in Vercel.
 */
export function gameDistributionEnabled(): boolean {
  return process.env.GAMEDISTRIBUTION_ENABLED?.trim().toLowerCase() !== "false";
}

/** GameDistribution-Kategorie → unsere Kategorie. Unbekannte werden über guessCategory() zugeordnet. */
const TO_SITE: Record<string, ArcadeCategory> = {
  Casual: "casual",
  Clicker: "casual",
  Puzzle: "puzzle",
  "Match-3": "puzzle",
  Merge: "puzzle",
  "Mahjong & Connect": "puzzle",
  Jigsaw: "puzzle",
  Bejeweled: "puzzle",
  "Bubble Shooter": "puzzle",
  Boardgames: "brain",
  Art: "creative",
  Care: "animals",
  "Racing & Driving": "racing",
  Sports: "sports",
  Football: "sports",
  Basketball: "sports",
  Quiz: "brain",
  Educational: "brain",
  Cards: "brain",
  Agility: "action",
  Shooter: "action",
  Battle: "action",
  ".IO": "action",
  Arcade: "action",
  Jumping: "action",
  "Dress-up": "creative",
  Cooking: "creative",
  Simulation: "strategy",
  Strategy: "strategy",
  Adventure: "strategy",
};

/** Schlagwörter, bei denen ein Spiel draußen bleibt (nur Glücksspiel) */
const BLOCKED_TAGS = /^(casino|gambling|slots?|poker|roulette|blackjack|betting)$/i;

type FeedItem = {
  Title?: string;
  Md5?: string;
  Description?: string;
  Type?: string;
  Width?: number;
  Height?: number;
  Asset?: string[];
  Category?: string[];
  Tag?: string[];
};

const PAGES = 8; // 8 × 100 neueste Spiele
const IMG = "https://img.gamedistribution.com/";

export function gdId(md5: string): string {
  return `gd-${md5}`;
}

/** Adresse zum Einbetten. referrer = genaue Adresse unserer Spielseite (für die Abrechnung). */
export function gdEmbedUrl(id: string, referrer: string): string | null {
  const md5 = id.startsWith("gd-") ? id.slice(3) : "";
  if (!/^[0-9a-f]{32}$/.test(md5)) return null;
  return `https://html5.gamedistribution.com/${md5}/?gd_sdk_referrer_url=${encodeURIComponent(referrer)}`;
}

/** Lädt die neuesten Spiele (zwischengespeichert, höchstens alle paar Stunden neu). */
export async function getGameDistributionCatalog(): Promise<ArcadeGame[]> {
  "use cache";
  cacheLife("hours");
  const out: ArcadeGame[] = [];
  const seen = new Set<string>();
  const now = Date.now();
  let rank = 0;
  for (let page = 1; page <= PAGES; page++) {
    let items: FeedItem[];
    try {
      const res = await fetch(
        `https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?collection=all&categories=All&tags=All&subType=all&type=all&mobile=all&rewarded=all&amount=100&page=${page}&format=json`,
      );
      if (!res.ok) break;
      items = (await res.json()) as FeedItem[];
    } catch {
      break;
    }
    if (!Array.isArray(items) || items.length === 0) break;
    for (const it of items) {
      rank++;
      const md5 = String(it?.Md5 ?? "");
      if (!/^[0-9a-f]{32}$/.test(md5) || seen.has(md5) || it.Type !== "html5") continue;
      const cat = (it.Category ?? []).map((c) => TO_SITE[c]).find(Boolean) ?? guessCategory(`${(it.Category ?? []).join(" ")} ${it.Title ?? ""}`);
      const title = String(it.Title ?? "").trim();
      const description = String(it.Description ?? "").trim();
      if (!title || BLOCKED_WORDS.test(`${title} ${description}`)) continue;
      if ((it.Tag ?? []).some((t) => BLOCKED_TAGS.test(String(t).trim()))) continue;
      const assets = (it.Asset ?? []).filter((a) => typeof a === "string" && a.startsWith(IMG));
      const banner = assets.find((a) => a.includes("-512x384.")) ?? assets[0];
      if (!banner) continue;
      const icon = assets.find((a) => a.includes("-512x512.")) ?? banner;
      seen.add(md5);
      out.push({
        source: "gd",
        id: gdId(md5),
        title: title.slice(0, 80),
        description: description.slice(0, 400),
        category: cat,
        width: Number(it.Width) || 800,
        height: Number(it.Height) || 600,
        banner,
        icon,
        // Der Katalog kommt nach Neuheit sortiert, hat aber kein Datum – Reihenfolge als Ersatz
        published: now - rank * 60_000,
      });
    }
  }
  return out;
}
