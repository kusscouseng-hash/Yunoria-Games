import Link from "next/link";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { GuildTagInfo } from "@/lib/guilds/queries";
import { GuildEmblem, GuildTag } from "./guild-tag";

/** Karte „Gilde“ für Profil und Konto – oder ein Hinweis, falls man in keiner ist. */
export function GuildCard({ guild, locale, dict, showEmpty = false }: { guild: GuildTagInfo | null; locale: Locale; dict: Dictionary; showEmpty?: boolean }) {
  const t = dict.guilds;
  if (!guild) {
    if (!showEmpty) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-surface/60 p-4">
        <p className="text-sm text-muted">🛡️ {t.noGuild}</p>
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-amber-300">{t.lockedLevel.replace("{level}", "100")}</span>
          <Link href={withLocale(locale, "/guilds")} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover">
            + {t.create}
          </Link>
        </span>
      </div>
    );
  }
  return (
    <Link href={withLocale(locale, `/guilds/${guild.tag}`)} className="flex items-center gap-4 rounded-2xl border border-border bg-surface/80 p-4 transition-colors hover:border-accent/50">
      <GuildEmblem image={guild.image} tag={guild.tag} color={guild.color} size={52} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{t.guildLabel}</p>
        <p className="flex items-center gap-2 truncate font-bold">
          {guild.name} <GuildTag tag={guild.tag} color={guild.color} />
        </p>
        <p className="text-xs text-muted">{t.roles[guild.role as "leader" | "officer" | "member"] ?? ""}</p>
      </div>
      <span className="ml-auto text-subtle" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
