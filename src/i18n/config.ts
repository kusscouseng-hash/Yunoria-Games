/**
 * Sprach-Einstellungen.
 * Englisch ist die Standardsprache (Hauptzielgruppe), Deutsch ist umschaltbar.
 * Neue Sprache: hier eintragen + Wörterbuch in ./dictionaries anlegen.
 */
export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie, in dem die vom Nutzer gewählte Sprache gespeichert wird. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Baut einen Link mit Sprachpräfix: withLocale("de", "/catalog") → "/de/catalog". */
export function withLocale(locale: Locale, path: string): string {
  if (path === "/") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Ersetzt die Sprache in einem bestehenden Pfad: "/en/catalog" → "/de/catalog". */
export function switchLocaleInPath(pathname: string, locale: Locale): string {
  const parts = pathname.split("/");
  if (parts[1] && hasLocale(parts[1])) {
    parts[1] = locale;
    return parts.join("/") || `/${locale}`;
  }
  return withLocale(locale, pathname);
}

/**
 * Wählt die beste Sprache aus dem Accept-Language-Header des Browsers.
 * Beispiel: "de-DE,de;q=0.9,en;q=0.8" → "de".
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.base && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);
  for (const { base } of preferred) {
    if (hasLocale(base)) return base;
  }
  return defaultLocale;
}
