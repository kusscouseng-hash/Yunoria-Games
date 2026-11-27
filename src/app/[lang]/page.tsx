import { Suspense } from "react";
import Link from "next/link";
import { Avatar } from "@/components/community/avatar";
import { GuildEmblem } from "@/components/guilds/guild-tag";
import { Mosaic, TileRow } from "@/components/tiles/tile-grids";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { CATEGORY_ICON, SITE_CATEGORIES, allTiles, byCategory, newest } from "@/lib/catalog";
import { GAME_RANK_SYSTEMS, gameRankForLevel } from "@/lib/game-ranks";
import { getGuildBoard } from "@/lib/guilds/queries";
import { levelFromXp } from "@/lib/levels";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { GuildColor } from "@/lib/supabase/database.types";

export default async function HomePage() {
  const { locale, dict } = await getDictionary();
  const b = dict.browse;
  const data = await allTiles(locale);
  // Mosaik oben: eigene Spiele + die bestbewerteten fremden Spiele
  const mosaic = [...data.own, ...data.arcade.slice(0, 56)];
  const row = (n = 14) => (tiles: typeof data.all) => tiles.slice(0, n);

  return (
    <div className="w-full space-y-8 px-4 py-5 sm:px-6">
      <Suspense fallback={<div className="h-16 animate-pulse rounded-2xl bg-surface" />}>
        <MyStrip locale={locale} dict={dict} />
      </Suspense>

      <section aria-label={b.forYou}>
        <h1 className="sr-only">{b.forYou}</h1>
        <Mosaic tiles={mosaic} originalLabel={b.original} />
      </section>

      <TileRow
        title={b.originalsRow}
        icon={CATEGORY_ICON.originals}
        href={withLocale(locale, "/c/originals")}
        showAll={b.showAll}
        tiles={data.own}
        originalLabel={b.original}
      />
      <TileRow
        title={b.newRow}
        icon={CATEGORY_ICON.new}
        href={withLocale(locale, "/c/new")}
        showAll={b.showAll}
        tiles={row()(newest(data.all))}
        originalLabel={b.original}
      />
      {SITE_CATEGORIES.map((cat) => (
        <TileRow
          key={cat}
          title={b.categories[cat]}
          icon={CATEGORY_ICON[cat]}
          href={withLocale(locale, `/c/${cat}`)}
          showAll={b.showAll}
          tiles={row()(byCategory(data.all, cat))}
          originalLabel={b.original}
        />
      ))}

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

/** Schmale Leiste oben: eigenes Level und Tages-XP – oder Einladung zum Mitmachen. */
async function MyStrip({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.games;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent-soft to-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-black">{t.heroTitle}</p>
          <p className="text-sm text-muted">{t.heroText}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink href={withLocale(locale, "/register")} size="sm">{dict.auth.register.submit}</ButtonLink>
          <ButtonLink href={withLocale(locale, "/login")} size="sm" variant="secondary">{dict.nav.login}</ButtonLink>
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
    <Link
      href={withLocale(locale, "/account")}
      className="grid items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border-strong sm:grid-cols-[auto_1fr_1fr] sm:gap-5 sm:p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar url={user.avatarUrl} name={user.username} size={44} className="border-2 border-accent/60" />
        <div className="min-w-0">
          <p className="truncate font-bold">{user.username}</p>
          <p className="text-xs font-semibold text-accent-hover">
            {GAME_RANK_SYSTEMS[user.gameRankSystem].label} · {rank.current.name}
          </p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted">
          <span className="font-bold text-foreground">Lv. {lvl.level}</span>
          <span>{lvl.xpForNext - lvl.xpIntoLevel} XP → Lv. {lvl.level + 1}</span>
        </div>
        <ProgressBar className="mt-1.5" value={lvl.xpIntoLevel} max={lvl.xpForNext} label={dict.auth.account.level} />
      </div>
      <div>
        <p className="text-xs text-muted">{t.todayXp.replace("{today}", String(today)).replace("{cap}", String(cap))}</p>
        <ProgressBar className="mt-1.5" value={today} max={cap} label={t.gameXp} />
      </div>
    </Link>
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

