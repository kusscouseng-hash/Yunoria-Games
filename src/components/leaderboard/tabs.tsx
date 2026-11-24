import Link from "next/link";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { cn } from "@/lib/cn";

/** Umschalter oben: Leser-Rangliste ↔ Gilden-Rangliste */
export function LeaderboardTabs({ locale, active, t }: { locale: Locale; active: "readers" | "guilds"; t: Dictionary["guilds"] }) {
  const tabs = [
    { key: "readers", href: "/leaderboard", label: `🏆 ${t.tabReaders}` },
    { key: "guilds", href: "/leaderboard/guilds", label: `🛡️ ${t.tabGuilds}` },
  ] as const;
  return (
    <nav className="mx-auto flex w-fit rounded-xl border border-border bg-surface/80 p-1" aria-label={t.tabGuilds}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={withLocale(locale, tab.href)}
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-bold transition-colors",
            active === tab.key ? "bg-accent text-white shadow" : "text-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
