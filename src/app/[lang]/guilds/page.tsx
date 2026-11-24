import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GuildEmblem, GuildTag } from "@/components/guilds/guild-tag";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { GUILD_MIN_LEVEL, getGuildBoard, guildTagsFor } from "@/lib/guilds/queries";
import { levelFromXp } from "@/lib/levels";


export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.guilds.hubTitle, description: dict.guilds.hubDescription };
}

export default async function GuildsPage({ searchParams }: PageProps<"/[lang]/guilds">) {
  const { locale, dict } = await getDictionary();
  const t = dict.guilds;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl" aria-hidden="true">🛡️</span>
            {t.hubTitle}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">{t.hubDescription}</p>
        </div>
        <Link href={withLocale(locale, "/leaderboard/guilds")} className="text-sm font-semibold text-accent-hover hover:underline">
          🏆 {t.title} →
        </Link>
      </div>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface" />}>
        <Board locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Board({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: PageProps<"/[lang]/guilds">["searchParams"] }) {
  const t = dict.guilds;
  const sp = await searchParams;
  const [user, board] = await Promise.all([getCurrentUser(), getGuildBoard("all", 100)]);
  const mine = user ? (await guildTagsFor([user.id])).get(user.id) ?? null : null;
  const myLevel = user ? levelFromXp(Math.max(user.currentXp, user.gameXp)).level : 0;
  const canCreate = !!user && (myLevel >= GUILD_MIN_LEVEL || user.role === "admin" || user.isOwner);
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US");
  const rows = board ?? [];
  const guildHref = (tag: string) => withLocale(locale, `/guilds/${tag}`);

  return (
    <>
      {sp.left && <p className="mt-4 text-center text-sm text-muted">{t.left}</p>}

      {/* Eigene Gilde */}
      {mine && (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface/80 p-4 text-sm">
          <span className="text-muted">{t.myGuild}:</span>
          <Link href={guildHref(mine.tag)} className="font-bold hover:underline">
            {mine.name}
          </Link>
          <GuildTag tag={mine.tag} color={mine.color} />
        </div>
      )}

      {/* Gilde gründen – immer sichtbar, mit Level-Voraussetzung */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/20 via-surface/80 to-surface/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-xl font-black">🛡️ {t.createBox}</h2>
            <p className="mt-1 text-sm text-muted">{t.createBoxText}</p>
            <span className="mt-3 inline-block rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
              {t.lockedLevel.replace("{level}", String(GUILD_MIN_LEVEL))}
            </span>
          </div>
          <div className="min-w-[220px] flex-1 sm:max-w-xs">
            {user && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{t.yourLevel.replace("{level}", String(myLevel))}</span>
                  <span className="text-subtle">{GUILD_MIN_LEVEL}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full bg-accent" style={{ width: `${Math.min(100, (myLevel / GUILD_MIN_LEVEL) * 100)}%` }} />
                </div>
              </>
            )}
            <div className="mt-3">
              {!user ? (
                <ButtonLink href={`${withLocale(locale, "/login")}?next=${encodeURIComponent(withLocale(locale, "/guilds/new"))}`} className="w-full">
                  {t.signInToCreate}
                </ButtonLink>
              ) : mine ? (
                <p className="text-xs text-muted">{t.inGuildAlready}</p>
              ) : canCreate ? (
                <ButtonLink href={withLocale(locale, "/guilds/new")} className="w-full">
                  + {t.create}
                </ButtonLink>
              ) : (
                <span className="flex h-10 w-full cursor-not-allowed items-center justify-center rounded-lg bg-surface-3 text-sm font-semibold text-subtle" aria-disabled="true">
                  {t.lockedLevel.replace("{level}", String(GUILD_MIN_LEVEL))}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">
          {t.allGuilds} <span className="text-sm font-medium text-subtle">({rows.length})</span>
        </h2>
        {rows.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t.empty} description={t.emptyText.replace("{level}", String(GUILD_MIN_LEVEL))} />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((g) => (
              <li key={g.guild_id}>
                <Link
                  href={guildHref(g.tag)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-surface/80 p-3 transition-colors hover:border-accent/50",
                    mine?.tag === g.tag ? "border-accent" : "border-border",
                  )}
                >
                  <GuildEmblem image={g.image_url} tag={g.tag} color={g.color} size={52} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{g.name}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <GuildTag tag={g.tag} color={g.color} /> 👥 {g.members}
                    </span>
                  </span>
                  <span className="text-right text-xs">
                    <span className="block font-black tabular-nums text-accent-hover">{nf.format(g.xp)}</span>
                    <span className="text-subtle">{t.xp}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
