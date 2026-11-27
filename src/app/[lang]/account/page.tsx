import { Suspense } from "react";
import { ActivityCalendar } from "@/components/profile/activity-calendar";
import { GuildCard } from "@/components/guilds/guild-card";
import { guildTagsFor } from "@/lib/guilds/queries";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormMessage } from "@/components/auth/auth-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { levelFromXp } from "@/lib/levels";
import { updateRankSystem } from "@/lib/profile/actions";
import { rankTier } from "@/lib/ranks";
import { GAME_RANK_SYSTEMS, gameRankForLevel } from "@/lib/game-ranks";
import { VISIBLE_GAMES } from "@/lib/games/registry";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/community/avatar";
import { AvatarForm } from "@/components/profile/avatar-form";
import { UsernameForm } from "@/components/profile/username-form";
import { BioForm } from "@/components/profile/bio-form";
import { UserBadge } from "@/components/community/user-badge";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.account.title, robots: { index: false } };
}

type SearchParams = PageProps<"/[lang]/account">["searchParams"];

export default async function AccountPage({ searchParams }: PageProps<"/[lang]/account">) {
  const { locale, dict } = await getDictionary();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{dict.auth.account.title}</h1>
      <Suspense fallback={<Card className="h-64 animate-pulse" />}>
        <AccountDetails t={dict.auth} dict={dict} locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

async function AccountDetails({
  t,
  dict,
  locale,
  searchParams,
}: {
  t: Dictionary["auth"];
  dict: Dictionary;
  locale: Locale;
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${withLocale(locale, "/login")}?next=${encodeURIComponent(withLocale(locale, "/account"))}`);
  }
  const sp = await searchParams;
  const a = t.account;

  // Spiele-Level und Spiele-Rang (getrennt vom Lese-Level auf Yunoria Scans)
  const lvl = levelFromXp(user.gameXp);
  const rank = gameRankForLevel(user.gameRankSystem, lvl.level);
  const system = GAME_RANK_SYSTEMS[user.gameRankSystem];

  const rows: Array<[string, string]> = [
    [a.username, user.username],
    [a.email, user.email ?? "–"],
    [dict.games.gameXp, user.gameXp.toLocaleString(locale)],
    [a.role, a.roles[user.role]],
  ];

  return (
    <div className="animate-fade-up space-y-6">
      {/* Profil-Kopf mit Rang und Level */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar url={user.avatarUrl} name={user.username} size={64} className="border-2 border-accent/60" />
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{user.username}</p>
            <Link href={withLocale(locale, `/u/${encodeURIComponent(user.username)}`)} className="text-xs font-semibold text-accent-hover hover:underline">
              {dict.profile.viewProfile} →
            </Link>
            <div className="mt-1 flex flex-wrap gap-2">
              <UserBadge isOwner={user.isOwner} role={user.role} t={dict.badges} />
              <Badge>
                {system.label} · {rank.current.name}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-subtle">{system.label}</p>
              <p className="text-2xl font-black text-accent-hover">{rank.current.name}</p>
            </div>
            <p className="text-right">
              <span className="block text-xs uppercase tracking-wider text-subtle">{a.level}</span>
              <span className="text-2xl font-black">{lvl.level}</span>
            </p>
          </div>
          <ProgressBar className="mt-3" value={lvl.xpIntoLevel} max={lvl.xpForNext} label={a.level} />
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted">
            <span>
              {lvl.progress >= 1 ? a.maxLevel : fill(a.xpToNext, { xp: lvl.xpForNext - lvl.xpIntoLevel, level: lvl.level + 1 })}
            </span>
            <span>
              {rank.next ? fill(a.nextRank, { rank: rank.next.name, level: rank.next.minLevel }) : a.topRank}
            </span>
          </div>
          <p className="mt-3 text-xs text-subtle">{dict.games.xpInfo}</p>
        </div>
      </Card>

      {/* Rangsystem wählen */}
      <Card className="p-6">
        <h2 className="text-lg font-bold">{a.chooseSystem}</h2>
        <p className="mt-1 text-sm text-muted">{dict.games.chooseSystemText}</p>
        {sp.saved === "rank" && (
          <div className="mt-4">
            <FormMessage tone="success">{a.systemSaved}</FormMessage>
          </div>
        )}
        {sp.error === "rank" && (
          <div className="mt-4">
            <FormMessage tone="error">{a.systemError}</FormMessage>
          </div>
        )}
        <form action={updateRankSystem} className="mt-5 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">{a.chooseSystem}</legend>
            {Object.values(GAME_RANK_SYSTEMS).map((s) => {
              const sysLevel = lvl.level;
              const preview = gameRankForLevel(s.id, sysLevel);
              return (
                <label
                  key={s.id}
                  className="cursor-pointer rounded-lg border border-border p-4 transition-colors hover:border-border-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-bold">
                      <input
                        type="radio"
                        name="rank_system"
                        value={s.id}
                        defaultChecked={s.id === user.gameRankSystem}
                        className="accent-[var(--color-accent)]"
                      />
                      {s.label}
                    </span>
                    <span className="text-right text-sm font-semibold text-accent-hover">
                      {preview.current.name}
                      <span className="block text-xs font-medium text-muted">{fill(a.systemLevel, { level: sysLevel })}</span>
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-subtle">
                    {s.ranks.map((r, i) => {
                      const tier = rankTier(i, s.ranks.length);
                      return (
                        <span key={r.name}>
                          {i > 0 && " → "}
                          <span className={tier ? `rank-${tier}` : r.name === preview.current.name ? "font-semibold text-accent-hover" : undefined}>
                            {r.name}
                          </span>
                        </span>
                      );
                    })}
                  </p>
                </label>
              );
            })}
          </fieldset>
          <Button type="submit">{a.saveSystem}</Button>
        </form>
      </Card>

      {/* Gilde */}
      <Suspense fallback={null}>
        <MyGuild userId={user.id} locale={locale} dict={dict} />
      </Suspense>

      {/* Eigene Bestwerte */}
      {VISIBLE_GAMES.length > 0 && (
        <Suspense fallback={null}>
          <MyBests locale={locale} dict={dict} />
        </Suspense>
      )}

      {/* Eigener Aktivitäts-Kalender (nur für einen selbst sichtbar) */}
      <Suspense fallback={<Card className="h-56 animate-pulse" />}>
        <ActivityCalendar
          t={dict.activity}
          locale={locale}
          months={sp.activity === "3" ? 3 : sp.activity === "6" ? 6 : 12}
          baseHref={withLocale(locale, "/account")}
        />
      </Suspense>


      {/* Profilbild + Name */}
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="mb-4 text-lg font-bold">{a.avatar}</h2>
          <AvatarForm url={user.avatarUrl} username={user.username} t={a} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold">{a.changeName}</h2>
          <UsernameForm current={user.username} t={a} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold">{dict.profile.bio}</h2>
          <BioForm bio={user.bio} t={dict.profile} />
        </div>
      </Card>


      {/* Kontodaten */}
      <Card className="p-6">
        <dl className="divide-y divide-border">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-3 text-sm first:pt-0">
              <dt className="text-muted">{label}</dt>
              <dd className="truncate text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-subtle">{a.comingNext}</p>
        <form action={signOut} className="mt-6">
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="secondary">
            {a.signOut}
          </Button>
        </form>
      </Card>
    </div>
  );
}

async function MyBests({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_game_stats");
  const stats = (data ?? {}) as { best?: Record<string, number>; games_played?: number; today_xp?: number; daily_cap?: number };
  const best = stats.best ?? {};
  const t = dict.games;
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US");
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{t.yourBests}</h2>
        <p className="text-xs text-subtle">
          {t.todayXp.replace("{today}", String(stats.today_xp ?? 0)).replace("{cap}", String(stats.daily_cap ?? 200))} · {t.gamesPlayed.replace("{n}", nf.format(stats.games_played ?? 0))}
        </p>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {VISIBLE_GAMES.map((g) => (
          <li key={g.slug}>
            <Link href={withLocale(locale, `/play/${g.slug}`)} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm hover:border-accent/60">
              <span className="font-semibold">{g.title[locale]}</span>
              <span className="font-bold tabular-nums" style={{ color: g.accent }}>{best[g.slug] != null ? nf.format(best[g.slug]) : "–"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

async function MyGuild({ userId, locale, dict }: { userId: string; locale: Locale; dict: Dictionary }) {
  const guild = (await guildTagsFor([userId])).get(userId) ?? null;
  return <GuildCard guild={guild} locale={locale} dict={dict} showEmpty />;
}
