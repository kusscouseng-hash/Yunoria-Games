import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateGuildForm } from "@/components/guilds/create-form";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { GUILD_MIN_LEVEL, guildTagsFor } from "@/lib/guilds/queries";
import { levelFromXp } from "@/lib/levels";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.guilds.createTitle, robots: { index: false } };
}

export default async function NewGuildPage() {
  const { locale, dict } = await getDictionary();
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <Link href={withLocale(locale, "/guilds")} className="text-sm text-muted hover:text-foreground">
        ← {dict.guilds.hubTitle}
      </Link>
      <h1 className="mt-2 text-3xl font-black tracking-tight">🛡️ {dict.guilds.createTitle}</h1>
      <p className="mt-2 text-sm text-muted">{dict.guilds.createIntro}</p>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-surface" />}>
        <Content locale={locale} dict={dict} />
      </Suspense>
    </div>
  );
}

async function Content({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.guilds;
  const user = await getCurrentUser();
  if (!user) redirect(`${withLocale(locale, "/login")}?next=${encodeURIComponent(withLocale(locale, "/guilds/new"))}`);
  const mine = (await guildTagsFor([user.id])).get(user.id);
  if (mine) redirect(withLocale(locale, `/guilds/${mine.tag}`));
  const { level } = levelFromXp(Math.max(user.currentXp, user.gameXp));
  const privileged = user.role === "admin" || user.isOwner;
  const allowed = privileged || level >= GUILD_MIN_LEVEL;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface/80 p-5 sm:p-6">
      <div className="mb-5">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">{t.yourLevel.replace("{level}", String(level))}</span>
          <span className="text-subtle">{t.requirement.replace("{level}", String(GUILD_MIN_LEVEL))}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full bg-accent" style={{ width: `${Math.min(100, (level / GUILD_MIN_LEVEL) * 100)}%` }} />
        </div>
      </div>
      {allowed ? (
        <CreateGuildForm locale={locale} t={t} minLevel={GUILD_MIN_LEVEL} />
      ) : (
        <p className="rounded-lg bg-surface-2 p-4 text-sm text-muted">{t.errors.level_too_low.replace("{level}", String(GUILD_MIN_LEVEL))}</p>
      )}
    </div>
  );
}
