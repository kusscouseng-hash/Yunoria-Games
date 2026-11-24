import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/community/avatar";
import { UserBadge } from "@/components/community/user-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { levelFromXp } from "@/lib/levels";
import { rankTier } from "@/lib/ranks";
import { gameRankForLevel, isGameRankSystem } from "@/lib/game-ranks";
import { createClient } from "@/lib/supabase/server";
import { Podium, RankRow } from "@/components/leaderboard/podium";
import { LeaderboardTabs } from "@/components/leaderboard/tabs";
import { GuildTag } from "@/components/guilds/guild-tag";
import { guildTagsFor } from "@/lib/guilds/queries";

type Period = "weekly" | "monthly" | "all";
const PERIODS: Period[] = ["weekly", "monthly", "all"];

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.leaderboard.title, description: dict.leaderboard.description };
}

export default async function LeaderboardPage({ searchParams }: PageProps<"/[lang]/leaderboard">) {
  const { locale, dict } = await getDictionary();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <LeaderboardTabs locale={locale} active="readers" t={dict.guilds} />
      <div className="mt-6 text-center">
        <h1 className="inline-flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl" aria-hidden="true">🏆</span>
          {dict.leaderboard.title}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{dict.leaderboard.description}</p>
      </div>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-[var(--radius-card)] bg-surface" />}>
        <Board locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Board({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: PageProps<"/[lang]/leaderboard">["searchParams"] }) {
  const t = dict.leaderboard;
  const sp = await searchParams;
  const period: Period = PERIODS.includes(sp.period as Period) ? (sp.period as Period) : "weekly";
  const supabase = await createClient();
  const [user, board] = await Promise.all([getCurrentUser(), supabase.rpc("game_leaderboard", { p_period: period, p_limit: 100 })]);
  const rows = board.data ?? [];
  const mineRow = user ? rows.find((r) => r.user_id === user.id) : undefined;
  const mine = mineRow ? { place: mineRow.place, xp: mineRow.xp, total_players: rows.length } : null;
  // Owner-Abzeichen (Migration 13) – "*" damit es auch vorher nicht scheitert
  const owners = new Set<string>();
  const guilds = await guildTagsFor(rows.map((r) => r.user_id));
  if (rows.length) {
    const { data: profs } = await supabase.from("profiles").select("*").in("id", rows.map((r) => r.user_id));
    for (const p of profs ?? []) if (p.is_owner) owners.add(p.id);
  }
  const href = (p: Period) => `${withLocale(locale, "/leaderboard")}?period=${p}`;
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US");
  const reset = period === "weekly" ? t.resetWeekly : period === "monthly" ? t.resetMonthly : t.resetAll;
  const meInList = user && rows.some((r) => r.user_id === user.id);

  return (
    <>
      <nav className="mt-6 flex flex-wrap justify-center gap-2" aria-label={t.title}>
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === period ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              p === period ? "border-accent bg-accent text-white" : "border-border bg-surface-2 text-muted hover:text-foreground",
            )}
          >
            {t.periods[p]}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-center text-xs text-subtle">
        {reset}
      </p>

      {/* Eigene Platzierung */}
      <div className="mt-5 rounded-[var(--radius-card)] border border-accent/40 bg-accent-soft p-4 text-sm">
        {user ? (
          mine ? (
            <p>
              <span className="text-muted">{t.yourPosition}: </span>
              <strong className="text-lg">#{mine.place}</strong>{" "}
              <span className="text-muted">{t.of.replace("{total}", nf.format(mine.total_players))}</span>
              <span className="ml-3 font-semibold">
                {nf.format(mine.xp)} {t.xp}
              </span>
            </p>
          ) : (
            <p className="text-muted">
              {t.notRanked}{" "}
              <Link href={withLocale(locale, "/")} className="font-semibold text-accent-hover hover:underline">
                {t.startReading} →
              </Link>
            </p>
          )
        ) : (
          <p className="text-muted">
            {t.signInHint}{" "}
            <Link href={`${withLocale(locale, "/login")}?next=${encodeURIComponent(withLocale(locale, "/leaderboard"))}`} className="font-semibold text-accent-hover hover:underline">
              {t.signIn}
            </Link>
          </p>
        )}
      </div>

      <div className="mt-12">
        {rows.length === 0 ? (
          <EmptyState title={t.empty} description={reset} />
        ) : (
          (() => {
            const info = (r: (typeof rows)[number]) => {
              const { level } = levelFromXp(r.total_xp);
              const rank = gameRankForLevel(isGameRankSystem(r.rank_system) ? r.rank_system : "league", level);
              const tier = rankTier(rank.index, rank.total);
              const g = guilds.get(r.user_id);
              return { level, rank, tier, g, href: withLocale(locale, `/u/${encodeURIComponent(r.username)}`) };
            };
            const top = rows.filter((r) => Number(r.place) <= 3).slice(0, 3);
            const rest = rows.slice(top.length);
            return (
              <>
                <Podium
                  entries={top.map((r) => {
                    const x = info(r);
                    return {
                      key: r.user_id,
                      place: Number(r.place),
                      href: x.href,
                      name: r.username,
                      picture: <Avatar url={r.avatar_url} name={r.username} size={84} className="border-0" />,
                      round: true,
                      badge: (
                        <>
                          <span className={cn("rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-black uppercase", x.tier ? `rank-${x.tier}` : "text-muted")}>
                            {t.level} {x.level} · {x.rank.current.name}
                          </span>
                          {x.g && <GuildTag tag={x.g.tag} emblem={x.g.emblem} color={x.g.color} />}
                        </>
                      ),
                      score: nf.format(r.xp),
                      scoreLabel: t.xp,
                      meta: null,
                      highlight: user?.id === r.user_id,
                    };
                  })}
                />
                {rest.length > 0 && (
                  <ol className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface/80">
                    {rest.map((r) => {
                      const x = info(r);
                      const isMe = user?.id === r.user_id;
                      return (
                        <RankRow
                          key={r.user_id}
                          place={Number(r.place)}
                          href={x.href}
                          picture={<Avatar url={r.avatar_url} name={r.username} size={40} />}
                          name={r.username}
                          badge={
                            <>
                              {isMe && <span className="rounded bg-accent px-1.5 text-[10px] font-bold uppercase text-white">{t.you}</span>}
                              {x.g && <GuildTag tag={x.g.tag} emblem={x.g.emblem} color={x.g.color} />}
                              <UserBadge isOwner={owners.has(r.user_id)} role={r.role} t={dict.badges} />
                            </>
                          }
                          sub={
                            <span className={cn("font-semibold", x.tier ? `rank-${x.tier}` : "text-muted")}>
                              {t.level} {x.level} · {x.rank.current.name}
                            </span>
                          }
                          score={nf.format(r.xp)}
                          scoreLabel={t.xp}
                          highlight={isMe}
                        />
                      );
                    })}
                  </ol>
                )}
              </>
            );
          })()
        )}
        {user && mine && !meInList && (
          <p className="mt-3 text-center text-sm text-muted">
            … #{mine.place} {user.username} · {nf.format(mine.xp)} {t.xp}
          </p>
        )}
      </div>
    </>
  );
}
