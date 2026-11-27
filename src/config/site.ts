/**
 * Zentrale Seiten-Konfiguration.
 * Der endgültige Name der Plattform steht noch nicht fest – hier an einer Stelle ändern.
 * Texte (Beschriftungen) stehen in src/i18n/dictionaries.
 */
export const siteConfig = {
  name: "Yunoria Games",
  shortName: "YG",
  /** Schwester-Seite mit gemeinsamem Konto */
  sisterSite: { name: "Yunoria Scans", url: "https://manga-site-eosin.vercel.app" },
  /** Hauptnavigation: Pfad ohne Sprachpräfix + Schlüssel im Wörterbuch (dict.nav) */
  nav: [
    { href: "/", key: "home" },
    { href: "/leaderboard", key: "leaderboard" },
    { href: "/guilds", key: "guilds" },
  ],
  footerNav: [
    { href: "/terms", key: "terms" },
    { href: "/imprint", key: "imprint" },
    { href: "/privacy", key: "privacy" },
  ],
} as const;

export type NavItem = { href: string; label: string };
