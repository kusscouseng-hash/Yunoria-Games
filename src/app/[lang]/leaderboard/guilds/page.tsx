import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GuildEmblem, GuildTag } from "@/components/guilds/guild-tag";
import { Podium, RankRow } from "@/components/leaderboard/podium";
import { LeaderboardTabs } from "@/components/leaderboard/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { GUILD_MIN_LEVEL, getGuildBoard, guildTagsFor } from "@/lib/guilds/queries";

type Period = "weekly" | "monthly" | "all";
const PERIODS: Period[] = ["weekly", "monthly", "all"];

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.guilds.title, description: dict.guilds.description };
}

export default async function GuildRankingPage({ searchParams }: PageProps<"/[lang]/leaderboard/guilds">) {
  const { locale, dict } = await getDictionary();
  const t = dict.guilds;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <LeaderboardTabs locale={locale} active="guilds" t={t} />
      <div className="mt-6 text-center">
        <h1 className="inline-flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl" aria-hidden="true">🛡️</span>
          {t.title}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t.description}</p>
      </div>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface" />}>
        <Board locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Board({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: PageProps<"/[lang]/leaderboard/guilds">["searchParams"] }) {
  const t = dict.guilds;
  const sp = await searchParams;
  const period: Period = PERIODS.includes(sp.period as Period) ? (sp.period as Period) : "weekly";
  const [user, board] = await Promise.all([getCurrentUser(), getGuildBoard(period, 50)]);
  const mine = user ? (await guildTagsFor([user.id])).get(user.id) ?? null : null;
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US");
  const href = (p: Period) => `${withLocale(locale, "/leaderboard/guilds")}?period=${p}`;
  const rows = board ?? [];
  const top = rows.slice(0, Math.min(3, rows.length));
  const rest = rows.slice(top.length);
  const guildHref = (tag: string) => withLocale(locale, `/guilds/${tag}`);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === period ? "page" : undefined}
            className={cn("rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors", p === period ? "border-accent bg-accent text-white" : "border-border bg-surface-2 text-muted hover:text-foreground")}
          >
            {dict.leaderboard.periods[p]}
          </Link>
        ))}
      </div>

      <div className="mt-12">
        {rows.length === 0 ? (
          <EmptyState title={t.empty} description={t.emptyText.replace("{level}", String(GUILD_MIN_LEVEL))} />
        ) : (
          <>
            <Podium
              entries={top.map((g, i) => ({
                key: g.guild_id,
                place: i + 1,
                href: guildHref(g.tag),
                name: g.name,
                picture: <GuildEmblem image={g.image_url} tag={g.tag} color={g.color} size={84} className="rounded-2xl" />,
                badge: <GuildTag tag={g.tag} color={g.color} />,
                score: nf.format(g.xp),
                scoreLabel: t.xp,
                meta: <>👥 {g.members}</>,
                highlight: mine?.tag === g.tag,
              }))}
            />
            {rest.length > 0 && (
              <ol className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface/80">
                {rest.map((g, i) => (
                  <RankRow
                    key={g.guild_id}
                    place={top.length + i + 1}
                    href={guildHref(g.tag)}
                    picture={<GuildEmblem image={g.image_url} tag={g.tag} color={g.color} size={40} />}
                    name={g.name}
                    badge={<GuildTag tag={g.tag} color={g.color} />}
                    meta={<>👥 {g.members}</>}
                    score={nf.format(g.xp)}
                    scoreLabel={t.xp}
                    highlight={mine?.tag === g.tag}
                  />
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </>
  );
}
