import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { embedUrl, gamepixSid, getArcadeCatalog } from "./gamepix";
import { gameDistributionEnabled, gdEmbedUrl, getGameDistributionCatalog } from "./gamedistribution";
import { PROVIDERS, type ArcadeCategory, type ArcadeGame, type ArcadeSource } from "./types";

/**
 * Alle Partner-Spiele an einer Stelle: vollständige Kataloge der Anbieter (für den
 * Admin-Bereich) und die handverlesene Auswahl (für die öffentliche Seite).
 */

export const PICKS_TAG = "arcade-picks";

const CATEGORIES = new Set<string>(["action", "puzzle", "racing", "sports", "brain", "casual", "creative", "animals", "strategy"]);

/** Welche Anbieter gerade eingeschaltet sind */
export function activeSources(): ArcadeSource[] {
  const out: ArcadeSource[] = [];
  if (gamepixSid()) out.push("gpx");
  if (gameDistributionEnabled()) out.push("gd");
  return out;
}

/** Vollständiger (gefilterter) Katalog eines Anbieters */
export async function providerCatalog(source: ArcadeSource): Promise<ArcadeGame[]> {
  if (source === "gpx") {
    const sid = gamepixSid();
    return sid ? getArcadeCatalog(sid) : [];
  }
  return gameDistributionEnabled() ? getGameDistributionCatalog() : [];
}

/**
 * Die handverlesene Auswahl, neueste zuerst. null = Tabelle fehlt noch (Migration nicht
 * ausgeführt) oder Datenbank nicht erreichbar → die Seite zeigt dann wie bisher GamePix.
 */
export async function getPicks(): Promise<ArcadeGame[] | null> {
  "use cache";
  cacheTag(PICKS_TAG);
  cacheLife("hours");
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("arcade_picks")
      .select("source, game_id, title, description, category, width, height, banner, icon, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error || !data) return null;
    return data
      .filter((r) => (r.source === "gpx" || r.source === "gd") && CATEGORIES.has(r.category))
      .map((r) => ({
        source: r.source,
        id: r.game_id,
        title: r.title,
        description: r.description,
        category: r.category as ArcadeCategory,
        width: r.width,
        height: r.height,
        banner: r.banner,
        icon: r.icon,
        published: Date.parse(r.created_at) || 0,
      }));
  } catch {
    return null;
  }
}

export type HiddenGame = { id: string; source: ArcadeSource; title: string; banner: string };

/**
 * Vom Admin versteckte Spiele (erscheinen nirgends, Spielseite gibt 404).
 * null, wenn die Tabelle noch fehlt (Migration nicht ausgeführt).
 */
export async function getHidden(): Promise<HiddenGame[] | null> {
  "use cache";
  cacheTag(PICKS_TAG);
  cacheLife("hours");
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("arcade_hidden")
      .select("game_id, source, title, banner")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error || !data) return null;
    return data
      .filter((r) => r.source === "gpx" || r.source === "gd")
      .map((r) => ({ id: r.game_id, source: r.source, title: r.title, banner: r.banner }));
  } catch {
    return null;
  }
}

/** Nur die IDs der versteckten Spiele (zum Herausfiltern) */
export async function hiddenIds(): Promise<Set<string>> {
  return new Set(((await getHidden()) ?? []).map((h) => h.id));
}

/** Ein Spiel finden – erst in der Auswahl, dann in den Katalogen (alte Links, Vorschau im Admin) */
export async function findArcadeGame(id: string): Promise<ArcadeGame | null> {
  if ((await hiddenIds()).has(id)) return null;
  const picks = await getPicks();
  const picked = picks?.find((g) => g.id === id);
  if (picked) return activeSources().includes(picked.source) ? picked : null;
  const source: ArcadeSource = id.startsWith("gd-") ? "gd" : "gpx";
  const catalog = await providerCatalog(source);
  return catalog.find((g) => g.id === id) ?? null;
}

/** iframe-Adresse. referrer = vollständige Adresse unserer Spielseite. */
export function arcadeEmbedUrl(game: ArcadeGame, referrer: string): string | null {
  if (game.source === "gpx") {
    const sid = gamepixSid();
    return sid ? embedUrl(game.id, sid) : null;
  }
  return gdEmbedUrl(game.id, referrer);
}

export function providerInfo(source: ArcadeSource) {
  return PROVIDERS[source];
}
