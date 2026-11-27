import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/community/avatar";
import { GameShell } from "@/components/games/game-shell";
import { GamePageLayout, recommend } from "@/components/tiles/game-page-layout";
import { TileRow } from "@/components/tiles/tile-grids";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { CATEGORY_ICON, allTiles } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { GAMES, OWN_GAMES_ENABLED, getGame, type GameInfo } from "@/lib/games/registry";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/play/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getDictionary();
  const game = getGame(slug);
  if (!game) return {};
  return { title: game.title[locale], description: game.tagline[locale] };
}

export default async function PlayPage({ params, searchParams }: PageProps<"/[lang]/play/[slug]">) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();
  const { locale, dict } = await getDictionary();
  // Eigene Spiele sind ausgeblendet → zur Startseite
  if (!OWN_GAMES_ENABLED) redirect(withLocale(locale, "/"));
  const t = dict.games;
  const b = dict.browse;
  const data = await allTiles(locale);
  const tile = data.own.find((x) => x.kind === "own" && x.slug === game.slug)!;

  return (
    <GamePageLayout
      tile={tile}
      subtitle={`${b.categories[tile.category]} · ${b.original} · ${t.xpPerRound}`}
      player={
        <Suspense fallback={<div className="min-h-[480px] animate-pulse rounded-3xl" style={{ background: game.color }} />}>
          <Shell game={game} locale={locale} dict={dict} />
        </Suspense>
      }
      recommended={recommend(tile, data.all)}
      recommendedTitle={b.recommended}
      originalLabel={b.original}
      stageLabels={b.stage}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-subtle">{t.howToPlay}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{game.tagline[locale]}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{game.howTo[locale]}</p>
        </section>
        <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface" />}>
          <TopScores game={game} locale={locale} dict={dict} searchParams={searchParams} />
        </Suspense>
      </div>
      <TileRow
        title={b.originalsRow}
        icon={CATEGORY_ICON.originals}
        href={withLocale(locale, "/c/originals")}
        showAll={b.showAll}
        tiles={data.own.filter((x) => x.key !== tile.key)}
        originalLabel={b.original}
      />
    </GamePageLayout>
  );
}

async function Shell({ game, locale, dict }: { game: GameInfo; locale: Locale; dict: Dictionary }) {
  const t = dict.games;
  const user = await getCurrentUser();
  let best = 0;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("game_best_scores").select("score").eq("user_id", user.id).eq("game", game.slug).maybeSingle();
    best = data?.score ?? 0;
  }
  const here = withLocale(locale, `/play/${game.slug}`);
  return (
    <GameShell
      slug={game.slug}
      color={game.color}
      accent={game.accent}
      howTo={game.howTo[locale]}
      best={best}
      signedIn={Boolean(user)}
      loginHref={`${withLocale(locale, "/login")}?next=${encodeURIComponent(here)}`}
      t={{
        play: t.play,
        again: t.again,
        score: t.score,
        best: t.best,
        gameOver: t.gameOver,
        xpGained: t.xpGained,
        newBest: t.newBest,
        todayXp: t.todayXp,
        capReached: t.capReached,
        signInToSave: t.signInToSave,
        signIn: t.signIn,
        tooFast: t.tooFast,
        implausible: t.implausible,
        error: t.error,
        saving: t.saving,
      }}
    />
  );
}

async function TopScores({
  game,
  locale,
  dict,
  searchParams,
}: {
  game: GameInfo;
  locale: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/play/[slug]">["searchParams"];
}) {
  const t = dict.games;
  const sp = await searchParams;
  const period = sp.top === "all" ? "all" : "weekly";
  const { data } = await createPublicClient().rpc("game_top_scores", { p_game: game.slug, p_period: period, p_limit: 10 });
  const rows = data ?? [];
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US");
  const here = withLocale(locale, `/play/${game.slug}`);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-black">{t.topScores}</h2>
        <div className="flex gap-1 text-xs">
          {(["weekly", "all"] as const).map((p) => (
            <Link
              key={p}
              href={p === "all" ? `${here}?top=all` : here}
              scroll={false}
              aria-current={p === period ? "page" : undefined}
              className={cn("rounded-full px-2.5 py-1 font-semibold", p === period ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-foreground")}
            >
              {p === "all" ? t.allTime : t.thisWeek}
            </Link>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.noScores}</p>
      ) : (
        <ol className="mt-3 divide-y divide-border">
          {rows.map((r) => (
            <li key={r.user_id}>
              <Link href={withLocale(locale, `/u/${encodeURIComponent(r.username)}`)} className="flex items-center gap-3 py-2 hover:text-accent-hover">
                <span className="w-5 text-sm font-black text-subtle">{r.place}</span>
                <Avatar url={r.avatar_url} name={r.username} size={30} />
                <span className="flex-1 truncate text-sm font-semibold">{r.username}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: game.accent }}>{nf.format(r.score)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
