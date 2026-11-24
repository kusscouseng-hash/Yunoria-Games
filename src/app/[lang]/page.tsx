import { Suspense } from "react";
import Link from "next/link";
import { Avatar } from "@/components/community/avatar";
import { GameArt } from "@/components/games/game-art";
import { GameCard } from "@/components/games/game-card";
import { GuildEmblem } from "@/components/guilds/guild-tag";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { GAME_RANK_SYSTEMS, gameRankForLevel } from "@/lib/game-ranks";
import { GAMES, GAME_OF_THE_WEEK, getGame } from "@/lib/games/registry";
import { getGuildBoard } from "@/lib/guilds/queries";
import { levelFromXp } from "@/lib/levels";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { GuildColor } from "@/lib/supabase/database.types";

export default async function HomePage() {
  const { locale, dict } = await getDictionary();
  const t = dict.games;
  const featured = getGame(GAME_OF_THE_WEEK)!;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Spiel der Woche */}
        <div className="relative flex min-h-[320px] items-end overflow-hidden rounded-3xl border border-border">
          <GameArt slug={featured.slug} color={featured.color} accent={featured.accent} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="relative space-y-3 p-6 sm:p-8">
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">{t.gameOfTheWeek}</span>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{featured.title[locale]}</h1>
            <p className="max-w-lg text-sm text-white/85 sm:text-base">{featured.tagline[locale]}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <ButtonLink href={withLocale(locale, `/play/${featured.slug}`)} size="lg">
                {t.playNow}
              </ButtonLink>
              <span className="text-sm font-bold text-amber-200">{t.xpPerRound}</span>
            </div>
          </div>
        </div>

        {/* Eigenes Level oder Einladung */}
        <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-3xl bg-surface" />}>
          <MyPanel locale={locale} dict={dict} />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black tracking-tight">{t.allGames}</h2>
        <Suspense fallback={<GameGrid locale={locale} dict={dict} best={{}} />}>
          <GamesWithBests locale={locale} dict={dict} />
        </Suspense>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-surface" />}>
          <TopPlayers locale={locale} dict={dict} />
        </Suspense>
        <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-surface" />}>
          <TopGuilds locale={locale} dict={dict} />
        </Suspense>
      </section>
    </div>
  );
}

function GameGrid({ locale, dict, best }: { locale: Locale; dict: Dictionary; best: Record<string, number> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      {GAMES.map((g) => (
        <GameCard key={g.slug} game={g} locale={locale} dict={dict} best={best[g.slug]} />
      ))}
    </div>
  );
}

async function GamesWithBests({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();
  let best: Record<string, number> = {};
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("game_best_scores").select("game, score").eq("user_id", user.id);
    best = Object.fromEntries((data ?? []).map((r) => [r.game, r.score]));
  }
  return <GameGrid locale={locale} dict={dict} best={best} />;
}

async function MyPanel({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.games;
  const a = dict.auth.account;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex flex-col justify-center gap-4 rounded-3xl border border-border bg-surface p-6">
        <h2 className="text-2xl font-black leading-tight">{t.heroTitle}</h2>
        <p className="text-sm text-muted">{t.heroText}</p>
        <p className="text-xs text-subtle">{t.sameAccount}</p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={withLocale(locale, "/register")}>{dict.auth.register.submit}</ButtonLink>
          <ButtonLink href={withLocale(locale, "/login")} variant="secondary">
            {dict.nav.login}
          </ButtonLink>
        </div>
      </div>
    );
  }
  const lvl = levelFromXp(user.gameXp);
  const rank = gameRankForLevel(user.gameRankSystem, lvl.level);
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_game_stats");
  const stats = (data ?? {}) as { today_xp?: number; daily_cap?: number };
  const today = stats.today_xp ?? 0;
  const cap = stats.daily_cap ?? 200;
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3">
        <Avatar url={user.avatarUrl} name={user.username} size={52} className="border-2 border-accent/60" />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{user.username}</p>
          <p className="text-xs font-semibold text-accent-hover">
            {GAME_RANK_SYSTEMS[user.gameRankSystem].label} · {rank.current.name}
          </p>
        </div>
      </div>
      <div className="rounded-2xl bg-surface-2 p-4">
        <div className="flex items-end justify-between">
          <span className="text-xs uppercase tracking-wider text-subtle">{t.yourLevel}</span>
          <span className="text-3xl font-black">{lvl.level}</span>
        </div>
        <ProgressBar className="mt-2" value={lvl.xpIntoLevel} max={lvl.xpForNext} label={a.level} />
        <p className="mt-2 text-xs text-muted">
          {lvl.xpForNext - lvl.xpIntoLevel} XP → Lv. {lvl.level + 1}
        </p>
      </div>
      <div className="rounded-2xl bg-surface-2 p-4">
        <p className="text-xs uppercase tracking-wider text-subtle">{t.todayXp.replace("{today}", String(today)).replace("{cap}", String(cap))}</p>
        <ProgressBar className="mt-2" value={today} max={cap} label={t.gameXp} />
      </div>
      <Link href={withLocale(locale, "/account")} className="text-sm font-semibold text-accent-hover hover:underline">
        {dict.profile.viewProfile} →
      </Link>
    </div>
  );
}

async function TopPlayers({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.games;
  const { data } = await createPublicClient().rpc("game_leaderboard", { p_period: "weekly", p_limit: 5 });
  const rows = data ?? [];
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-lg font-black">{t.topPlayers}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.noScores}</p>
      ) : (
        <ol className="mt-3 divide-y divide-border">
          {rows.map((r) => (
            <li key={r.user_id}>
              <Link href={withLocale(locale, `/u/${encodeURIComponent(r.username)}`)} className="flex items-center gap-3 py-2.5 hover:text-accent-hover">
                <span className="w-6 text-sm font-black text-subtle">{r.place}</span>
                <Avatar url={r.avatar_url} name={r.username} size={34} />
                <span className="flex-1 truncate font-semibold">{r.username}</span>
                <span className="text-sm font-bold tabular-nums">{r.xp} XP</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <Link href={withLocale(locale, "/leaderboard")} className="mt-3 inline-block text-sm font-semibold text-accent-hover hover:underline">
        {t.fullRanking} →
      </Link>
    </div>
  );
}

async function TopGuilds({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.games;
  const rows = ((await getGuildBoard("weekly", 5)) ?? []).slice(0, 5);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-lg font-black">{t.topGuilds}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.noScores}</p>
      ) : (
        <ol className="mt-3 divide-y divide-border">
          {rows.map((g) => (
            <li key={g.guild_id}>
              <Link href={withLocale(locale, `/guilds/${g.tag}`)} className="flex items-center gap-3 py-2.5 hover:text-accent-hover">
                <span className="w-6 text-sm font-black text-subtle">{g.place}</span>
                <GuildEmblem image={g.image_url} tag={g.tag} color={g.color as GuildColor} size={34} />
                <span className="flex-1 truncate font-semibold">{g.name}</span>
                <span className="text-sm font-bold tabular-nums">{g.xp} XP</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <Link href={withLocale(locale, "/leaderboard/guilds")} className="mt-3 inline-block text-sm font-semibold text-accent-hover hover:underline">
        {t.fullRanking} →
      </Link>
    </div>
  );
}
