/**
 * Gemeinsame Form für eingebettete Spiele fremder Anbieter (GamePix, GameDistribution).
 * Die Anbieter-Dateien bringen ihre Spiele in diese Form und ordnen sie gleich einer
 * unserer Kategorien zu.
 */
export const ARCADE_SOURCES = ["gpx", "gd"] as const;
export type ArcadeSource = (typeof ARCADE_SOURCES)[number];

/** Unsere eigenen Kategorien (müssen zu SITE_CATEGORIES in src/lib/catalog.ts passen) */
export type ArcadeCategory = "action" | "puzzle" | "racing" | "sports" | "brain" | "casual" | "creative" | "animals" | "strategy";

export type ArcadeGame = {
  source: ArcadeSource;
  /** Teil der Adresse /arcade/<id> – bei GamePix der Namespace, bei GameDistribution „gd-<md5>“ */
  id: string;
  title: string;
  description: string;
  category: ArcadeCategory;
  width: number;
  height: number;
  /** Breites Vorschaubild */
  banner: string;
  /** Quadratisches Vorschaubild */
  icon: string;
  /** Zeitpunkt für „Neu“ (ms) */
  published: number;
};

export function isArcadeSource(v: string): v is ArcadeSource {
  return (ARCADE_SOURCES as readonly string[]).includes(v);
}

/** Name und Datenschutz-Link je Anbieter (für den Hinweis vor dem Laden) */
export const PROVIDERS: Record<ArcadeSource, { name: string; privacyUrl: string; imageHost: string }> = {
  gpx: {
    name: "GamePix",
    privacyUrl: "https://www.iubenda.com/privacy-policy/64038034/cookie-policy",
    imageHost: "https://img.gamepix.com/",
  },
  gd: {
    name: "GameDistribution",
    privacyUrl: "https://www.azerion.com/privacy-policy/",
    imageHost: "https://img.gamedistribution.com/",
  },
};

/** Titel/Beschreibungen mit diesen Wörtern bleiben draußen (familienfreundlich). */
export const BLOCKED_WORDS =
  /\b(gun|guns|sniper|shoot\w*|shooter|kill\w*|blood\w*|zombie\w*|war|warfare|army|horror|scary|gore|weapon\w*|bomb\w*|dating|kiss\w*|girlfriend|boyfriend|sexy|casino|gambl\w*|slots?|poker|bet|betting|prank|fight\w*|battle\w*|knife|assassin\w*|murder\w*)\b/i;
