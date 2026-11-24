import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/community/avatar";
import { GuildEmblem, GuildTag, GUILD_COLOR_LIST } from "@/components/guilds/guild-tag";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { adminClearGuildImage, joinGuild, kickMember, leaveGuild, renameGuild, setMemberRole, updateGuild, updateGuildImage } from "@/lib/guilds/actions";
import { AvatarForm } from "@/components/profile/avatar-form";
import { GUILD_MEMBER_LIMIT, GUILD_MIN_LEVEL, getGuildByTag, getGuildRoster, guildTagsFor } from "@/lib/guilds/queries";
import { levelFromXp } from "@/lib/levels";
import { gameRankForLevel } from "@/lib/game-ranks";
import { rankTier } from "@/lib/ranks";
import type { GuildError } from "@/lib/guilds/actions";

type Props = PageProps<"/[lang]/guilds/[tag]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const g = await getGuildByTag(tag);
  return g ? { title: `${g.name} [${g.tag}]`, description: g.description ?? undefined } : { robots: { index: false } };
}

/** Wann der Name wieder geändert werden darf (null = jetzt). */
function renameAvailableAt(changedAt: string | null | undefined): Date | null {
  if (!changedAt) return null;
  const next = new Date(new Date(changedAt).getTime() + 7 * 24 * 3600 * 1000);
  return next.getTime() > Date.now() ? next : null;
}

export default async function GuildPage({ params, searchParams }: Props) {
  const { locale, dict } = await getDictionary();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Link href={withLocale(locale, "/guilds")} className="text-sm text-muted hover:text-foreground">
        ← {dict.guilds.hubTitle}
      </Link>
      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-2xl bg-surface" />}>
        <Content locale={locale} dict={dict} params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const ERRORS: GuildError[] = ["level_too_low", "already_in_guild", "guild_full", "guild_closed", "name", "tag", "taken", "not_allowed", "rename_cooldown", "generic"];

async function Content({ locale, dict, params, searchParams }: { locale: Locale; dict: Dictionary; params: Props["params"]; searchParams: Props["searchParams"] }) {
  const t = dict.guilds;
  const { tag } = await params;
  const sp = await searchParams;
  const guild = await getGuildByTag(tag);
  if (!guild) notFound();
  const [user, roster] = await Promise.all([getCurrentUser(), getGuildRoster(guild.id, "all")]);
  const myGuild = user ? (await guildTagsFor([user.id])).get(user.id) ?? null : null;
  const me = user ? roster.find((m) => m.user_id === user.id) ?? null : null;
  const isLeader = me?.role === "leader";
  const renameAt = renameAvailableAt(guild.name_changed_at);
  const canRename = !renameAt;
  const isOfficer = me?.role === "officer";
  const totalXp = roster.reduce((s, m) => s + Number(m.game_xp), 0);
  const full = roster.length >= GUILD_MEMBER_LIMIT;
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US");
  const df = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "long" });
  const error = typeof sp.error === "string" && (ERRORS as string[]).includes(sp.error) ? (sp.error as GuildError) : null;
  const hidden = (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="tag" value={guild.tag} />
    </>
  );

  return (
    <>
      {/* Kopf */}
      <section className="relative mt-4 overflow-hidden rounded-3xl border border-border bg-surface/80 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 opacity-40 blur-2xl" aria-hidden="true">
          <GuildEmblem color={guild.color} size={260} className="rounded-full" />
        </div>
        <div className="relative flex flex-wrap items-center gap-5">
          <GuildEmblem image={guild.image_url} tag={guild.tag} color={guild.color} size={88} className="rounded-2xl ring-2 ring-white/10" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{guild.name}</h1>
              <GuildTag tag={guild.tag} emblem={guild.emblem} color={guild.color} className="text-xs" />
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", guild.is_open && !full ? "bg-success/15 text-success" : "bg-surface-3 text-muted")}>
                {full ? t.full : guild.is_open ? t.open : t.closed}
              </span>
            </div>
            <p className="mt-1 text-xs text-subtle">{t.founded.replace("{date}", df.format(new Date(guild.created_at)))}</p>
            {guild.description && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm text-muted">{guild.description}</p>}
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="rounded-xl border border-border bg-surface-2/70 p-3">
            <p className="text-xl font-black tabular-nums text-accent-hover">{nf.format(totalXp)}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{t.xp}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2/70 p-3">
            <p className="text-xl font-black tabular-nums">
              {roster.length}
              <span className="text-sm text-subtle"> / {GUILD_MEMBER_LIMIT}</span>
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{t.members}</p>
          </div>
        </div>

        {/* Aktionen */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {!user ? (
            <Link href={`${withLocale(locale, "/login")}?next=${encodeURIComponent(withLocale(locale, `/guilds/${guild.tag}`))}`} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover">
              {t.signInToJoin}
            </Link>
          ) : me ? (
            <form action={leaveGuild}>
              {hidden}
              <button type="submit" className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold hover:bg-surface-2" title={t.leaveHint}>
                {t.leave}
              </button>
            </form>
          ) : !myGuild && guild.is_open && !full ? (
            <form action={joinGuild}>
              {hidden}
              <input type="hidden" name="guild_id" value={guild.id} />
              <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover">
                {t.join}
              </button>
            </form>
          ) : null}
        </div>
        {me && <p className="relative mt-2 text-xs text-subtle">{t.leaveHint}</p>}
        {sp.joined && <p className="relative mt-3 text-sm font-semibold text-success">{t.joined}</p>}
        {sp.saved && <p className="relative mt-3 text-sm font-semibold text-success">{t.saved}</p>}
        {sp.renamed && <p className="relative mt-3 text-sm font-semibold text-success">{t.renamed}</p>}
        {error && <p role="alert" className="relative mt-3 text-sm font-semibold text-accent-hover">{t.errors[error].replace("{level}", String(GUILD_MIN_LEVEL))}</p>}
      </section>

      {/* Mitglieder */}
      <section className="mt-8">
        <h2 className="text-lg font-bold">
          👥 {t.members} <span className="text-sm font-medium text-subtle">({roster.length})</span>
        </h2>
        <ol className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface/80">
          {roster.map((m, i) => {
            const { level } = levelFromXp(Number(m.game_xp));
            const rank = gameRankForLevel(m.game_rank_system, level);
            const tier = rankTier(rank.index, rank.total);
            const canKick = user && m.user_id !== user.id && (isLeader || (isOfficer && m.role === "member"));
            return (
              <li key={m.user_id} className={cn("flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0", user?.id === m.user_id && "bg-accent-soft")}>
                <span className="w-6 text-center text-sm font-black text-subtle">{i + 1}</span>
                <Avatar url={m.avatar_url} name={m.username} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    <Link href={withLocale(locale, `/u/${encodeURIComponent(m.username)}`)} className="truncate hover:text-accent-hover hover:underline">
                      {m.username}
                    </Link>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", m.role === "leader" ? "bg-amber-400/20 text-amber-300" : m.role === "officer" ? "bg-blue-500/20 text-blue-300" : "bg-surface-3 text-muted")}>
                      {m.role === "leader" ? "👑 " : ""}
                      {t.roles[m.role]}
                    </span>
                  </p>
                  <p className={cn("truncate text-xs font-semibold", tier ? `rank-${tier}` : "text-muted")}>
                    {dict.leaderboard.level} {level} · {rank.current.name}
                  </p>
                </div>
                <span className="text-right">
                  <span className="block font-black tabular-nums text-accent-hover">{nf.format(Number(m.xp))}</span>
                  <span className="text-[10px] font-semibold uppercase text-subtle">{t.xp}</span>
                </span>
                {(canKick || (isLeader && m.user_id !== user?.id)) && (
                  <div className="flex w-full justify-end gap-2 sm:w-auto">
                    {isLeader && m.role !== "leader" && (
                      <form action={setMemberRole}>
                        {hidden}
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <input type="hidden" name="role" value={m.role === "officer" ? "member" : "officer"} />
                        <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-surface-2">
                          {m.role === "officer" ? t.demote : t.promote}
                        </button>
                      </form>
                    )}
                    {canKick && (
                      <form action={kickMember}>
                        {hidden}
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <button type="submit" className="rounded-md border border-accent/50 px-2 py-1 text-xs font-semibold text-accent-hover hover:bg-accent-soft">
                          {t.kick}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Moderation: Admin kann ein unpassendes Bild entfernen */}
      {user?.role === "admin" && guild.image_url && (
        <form action={adminClearGuildImage} className="mt-6">
          {hidden}
          <input type="hidden" name="guild_id" value={guild.id} />
          <button type="submit" className="rounded-lg border border-accent/50 px-3 py-1.5 text-xs font-semibold text-accent-hover hover:bg-accent-soft">
            🛡️ {t.adminRemoveImage}
          </button>
        </form>
      )}

      {/* Bearbeiten (nur Anführer) */}
      {isLeader && (
        <section className="mt-8 rounded-2xl border border-border bg-surface/80 p-5">
          <h2 className="text-lg font-bold">✏️ {t.edit}</h2>
          <form action={renameGuild} className="mt-4 space-y-2">
            {hidden}
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">{t.nameLabel}</span>
              <span className="flex flex-wrap gap-2">
                <input name="name" required minLength={3} maxLength={32} defaultValue={guild.name} className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm focus:border-accent focus:outline-none" />
                <button type="submit" disabled={!canRename} className="h-10 rounded-lg border border-border bg-surface-2 px-4 text-sm font-bold hover:border-accent disabled:opacity-50">
                  {t.rename}
                </button>
              </span>
            </label>
            <p className="text-xs text-subtle">
              {canRename ? t.renameHint : t.renameNext.replace("{date}", renameAt!.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", { day: "numeric", month: "long" }))}
            </p>
          </form>
          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 text-sm font-semibold">{t.image}</p>
            <AvatarForm
              url={guild.image_url ?? null}
              username={guild.tag}
              t={{ ...dict.auth.account, avatarHint: t.imageHint, avatarCropTitle: t.image }}
              uploadAction={updateGuildImage}
              square
              preview={<GuildEmblem image={guild.image_url} tag={guild.tag} color={guild.color} size={64} />}
            />
          </div>
          <form action={updateGuild} className="mt-6 space-y-4 border-t border-border pt-5">
            {hidden}
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">{t.descriptionLabel}</span>
              <textarea name="description" maxLength={300} rows={3} defaultValue={guild.description ?? ""} className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </label>
            <fieldset>
              <legend className="text-sm font-semibold">{t.color}</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {GUILD_COLOR_LIST.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-1.5">
                    <input type="radio" name="color" value={c} defaultChecked={guild.color === c} className="accent-[var(--color-accent)]" />
                    <GuildEmblem color={c} size={24} className="rounded-md" />
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_open" defaultChecked={guild.is_open} className="accent-[var(--color-accent)]" />
              {t.isOpen}
            </label>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover">
              {t.save}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
