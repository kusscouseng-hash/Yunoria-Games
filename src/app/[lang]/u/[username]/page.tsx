import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/community/avatar";
import { UserBadge } from "@/components/community/user-badge";
import { GuildCard } from "@/components/guilds/guild-card";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { GAME_RANK_SYSTEMS, gameRankForLevel, isGameRankSystem } from "@/lib/game-ranks";
import { GAMES } from "@/lib/games/registry";
import { guildTagsFor } from "@/lib/guilds/queries";
import { levelFromXp } from "@/lib/levels";
import { rankTier } from "@/lib/ranks";
import { createClient } from "@/lib/supabase/server";

type Params = PageProps<"/[lang]/u/[username]">["params"];

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: decodeURIComponent(username), robots: { index: false } };
}

export default async function ProfilePage({ params }: PageProps<"/[lang]/u/[username]">) {
  const { locale, dict } = await getDictionary();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface" />}>
        <Profile locale={locale} dict={dict} params={params} />
      </Suspense>
    </div>
  );
}

async function Profile({ locale, dict, params }: { locale: Locale; dict: Dictionary; params: Params }) {
  const { username } = await params;
  const name = decodeURIComponent(username);
  if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) notFound();
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("*").eq("username", name).maybeSingle();
  if (!p) notFound();

  const [guildMap, { data: game }, { data: bests }] = await Promise.all([
    guildTagsFor([p.id]),
    supabase.from("game_profiles").select("xp, rank_system, games_played").eq("user_id", p.id).maybeSingle(),
    supabase.from("game_best_scores").select("game, score").eq("user_id", p.id),
  ]);
  const guild = guildMap.get(p.id) ?? null;
  const system = game && isGameRankSystem(game.rank_system) ? game.rank_system : "league";
  const lvl = levelFromXp(game?.xp ?? 0);
  const rank = gameRankForLevel(system, lvl.level);
  const tier = rankTier(rank.index, rank.total);
  const best = new Map((bests ?? []).map((b) => [b.game, b.score]));
  const t = dict.profile;
  const g = dict.games;
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US");
  const since = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { month: "long", year: "numeric" }).format(new Date(p.created_at));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar url={p.avatar_url} name={p.username} size={96} className="border-2 border-accent/60" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-black">{p.username}</h1>
              <UserBadge isOwner={p.is_owner} role={p.role} t={dict.badges} />
            </div>
            <p className={cn("mt-1 text-sm font-semibold", tier ? `rank-${tier}` : "text-accent-hover")}>
              {GAME_RANK_SYSTEMS[system].label} · {t.level.replace("{level}", String(lvl.level)).replace("{rank}", rank.current.name)}
            </p>
            <p className="mt-1 text-xs text-subtle">
              {t.memberSince.replace("{date}", since)} · {g.gamesPlayed.replace("{n}", nf.format(game?.games_played ?? 0))}
            </p>
            <ProgressBar className="mt-3 max-w-sm" value={lvl.xpIntoLevel} max={lvl.xpForNext} label={dict.auth.account.level} />
          </div>
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <h2 className="text-sm font-bold text-muted">{t.bio}</h2>
          <p className="mt-1 whitespace-pre-line break-words text-sm">{p.bio || <span className="text-subtle">{t.noBio}</span>}</p>
        </div>
      </Card>

      <GuildCard guild={guild} locale={locale} dict={dict} />

      <Card className="p-5">
        <h2 className="text-lg font-bold">{g.yourBests.replace(/^(Your|Deine) /, "")}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {GAMES.map((gm) => (
            <li key={gm.slug}>
              <Link href={withLocale(locale, `/play/${gm.slug}`)} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm hover:border-accent/60">
                <span className="font-semibold">{gm.title[locale]}</span>
                <span className="font-bold tabular-nums" style={{ color: gm.accent }}>{best.has(gm.slug) ? nf.format(best.get(gm.slug)!) : "–"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
